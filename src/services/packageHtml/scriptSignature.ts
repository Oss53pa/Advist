/**
 * scriptSignature.ts — Vanilla JS engine injected into standalone HTML documents
 *
 * This script is serialized as a string and embedded in packaged HTML files sent
 * to external signers. It runs without any framework, bundler, or external dependency.
 *
 * Features:
 * - PEN engine: variable-width strokes based on speed/pressure, smoothing, taper
 * - Canvas drawing with pointer events + requestAnimationFrame rendering
 * - 3 signature sources: draw, import image (PNG/JPG), or reuse saved (localStorage)
 * - Drag & resize placement of the signature on the document overlay
 * - Security: blocks right-click, drag, copy on signature zones
 * - Invisible watermark with signer name/email/document hash
 */

// ---------------------------------------------------------------------------
// This entire file exports a single string that will be injected into a
// <script> tag inside a self-contained HTML document.
// ---------------------------------------------------------------------------

export const SIGNATURE_SCRIPT = /* javascript */ `
(function() {
  'use strict';

  // =========================================================================
  // CONSTANTS
  // =========================================================================

  var STORAGE_KEY = 'advist_saved_signatures';
  var MAX_SAVED = 5;
  var MIN_STROKE_WIDTH = 1.2;
  var MAX_STROKE_WIDTH = 4.5;
  var SMOOTHING = 0.3;
  var TAPER_LENGTH = 12;

  // =========================================================================
  // UTILITIES
  // =========================================================================

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function(k) {
      if (k === 'style' && typeof attrs[k] === 'object') {
        Object.assign(e.style, attrs[k]);
      } else if (k.startsWith('on')) {
        e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      } else {
        e.setAttribute(k, attrs[k]);
      }
    });
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function(c) {
        e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return e;
  }

  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

  function distance(a, b) {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  // Simple SHA-256 hash (Web Crypto)
  function sha256(text) {
    var enc = new TextEncoder();
    return crypto.subtle.digest('SHA-256', enc.encode(text)).then(function(buf) {
      return Array.from(new Uint8Array(buf)).map(function(b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    });
  }

  // =========================================================================
  // PEN ENGINE — variable-width stroke rendering
  // =========================================================================

  var PenEngine = {
    points: [],
    // The raw input points with pressure/timestamp

    /**
     * Add a point from a pointer event.
     */
    addPoint: function(x, y, pressure, timestamp) {
      var pt = { x: x, y: y, pressure: pressure || 0.5, time: timestamp || Date.now() };
      this.points.push(pt);
      return pt;
    },

    clear: function() {
      this.points = [];
    },

    /**
     * Compute the stroke width at a given point based on pressure and velocity.
     */
    _widthAt: function(idx) {
      var pt = this.points[idx];
      var pressure = pt.pressure;

      // Velocity-based thinning
      if (idx > 0) {
        var prev = this.points[idx - 1];
        var dt = Math.max(pt.time - prev.time, 1);
        var dist = distance(pt, prev);
        var velocity = dist / dt; // px/ms
        // Faster movement = thinner stroke
        var velocityFactor = 1 - clamp(velocity / 2, 0, 0.6);
        pressure = pressure * 0.6 + velocityFactor * 0.4;
      }

      // Taper at start
      if (idx < TAPER_LENGTH) {
        pressure *= idx / TAPER_LENGTH;
      }
      // Taper at end
      var remaining = this.points.length - 1 - idx;
      if (remaining < TAPER_LENGTH) {
        pressure *= remaining / TAPER_LENGTH;
      }

      return lerp(MIN_STROKE_WIDTH, MAX_STROKE_WIDTH, clamp(pressure, 0, 1));
    },

    /**
     * Smooth the points using exponential moving average.
     */
    _smoothed: function() {
      if (this.points.length < 2) return this.points.slice();

      var smoothed = [this.points[0]];
      for (var i = 1; i < this.points.length; i++) {
        var prev = smoothed[i - 1];
        var curr = this.points[i];
        smoothed.push({
          x: lerp(prev.x, curr.x, 1 - SMOOTHING),
          y: lerp(prev.y, curr.y, 1 - SMOOTHING),
          pressure: curr.pressure,
          time: curr.time,
        });
      }
      return smoothed;
    },

    /**
     * Render the current stroke to a canvas 2D context.
     */
    render: function(ctx, color) {
      if (this.points.length < 2) {
        // Dot
        if (this.points.length === 1) {
          var p = this.points[0];
          ctx.beginPath();
          ctx.arc(p.x, p.y, MIN_STROKE_WIDTH, 0, Math.PI * 2);
          ctx.fillStyle = color || '#171717';
          ctx.fill();
        }
        return;
      }

      var pts = this._smoothed();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color || '#171717';

      for (var i = 1; i < pts.length; i++) {
        var w = this._widthAt(i);
        ctx.beginPath();
        ctx.lineWidth = w;

        if (i === 1) {
          ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
          ctx.lineTo(pts[i].x, pts[i].y);
        } else {
          // Quadratic curve through midpoints for smoothness
          var mid = {
            x: (pts[i - 1].x + pts[i].x) / 2,
            y: (pts[i - 1].y + pts[i].y) / 2,
          };
          ctx.moveTo(
            (pts[i - 2].x + pts[i - 1].x) / 2,
            (pts[i - 2].y + pts[i - 1].y) / 2
          );
          ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, mid.x, mid.y);
        }

        ctx.stroke();
      }
    },
  };

  // =========================================================================
  // SIGNATURE PAD — canvas drawing with pointer events
  // =========================================================================

  function createSignaturePad(container, opts) {
    opts = opts || {};
    var padWidth = opts.width || 460;
    var padHeight = opts.height || 160;
    var color = opts.color || '#171717';

    var canvas = el('canvas', {
      width: padWidth * 2,
      height: padHeight * 2,
      style: {
        width: padWidth + 'px',
        height: padHeight + 'px',
        touchAction: 'none',
        cursor: 'crosshair',
        background: '#fff',
        borderRadius: '8px',
        border: '2px dashed #d4d4d4',
      },
    });

    var ctx = canvas.getContext('2d');
    ctx.scale(2, 2); // Retina

    var strokes = []; // Array of ImageData snapshots for undo
    var isDrawing = false;
    var rafId = null;
    var dirty = false;

    function saveSnapshot() {
      strokes.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }

    function render() {
      if (dirty) {
        // Clear and redraw last snapshot + current live stroke
        if (strokes.length > 0) {
          ctx.putImageData(strokes[strokes.length - 1], 0, 0);
        } else {
          ctx.clearRect(0, 0, padWidth, padHeight);
        }
        PenEngine.render(ctx, color);
        dirty = false;
      }
      rafId = requestAnimationFrame(render);
    }

    function getCoords(e) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (padWidth / rect.width),
        y: (e.clientY - rect.top) * (padHeight / rect.height),
        pressure: e.pressure > 0 ? e.pressure : 0.5,
      };
    }

    canvas.addEventListener('pointerdown', function(e) {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      isDrawing = true;
      PenEngine.clear();
      var c = getCoords(e);
      PenEngine.addPoint(c.x, c.y, c.pressure);
      dirty = true;
    });

    canvas.addEventListener('pointermove', function(e) {
      if (!isDrawing) return;
      e.preventDefault();
      var c = getCoords(e);
      PenEngine.addPoint(c.x, c.y, c.pressure);
      dirty = true;
    });

    function endStroke() {
      if (!isDrawing) return;
      isDrawing = false;
      // Render final stroke to canvas
      if (strokes.length > 0) {
        ctx.putImageData(strokes[strokes.length - 1], 0, 0);
      } else {
        ctx.clearRect(0, 0, padWidth, padHeight);
      }
      PenEngine.render(ctx, color);
      saveSnapshot();
      PenEngine.clear();
    }

    canvas.addEventListener('pointerup', endStroke);
    canvas.addEventListener('pointerleave', endStroke);

    // Start render loop
    rafId = requestAnimationFrame(render);

    container.appendChild(canvas);

    return {
      canvas: canvas,
      isEmpty: function() { return strokes.length === 0; },
      clear: function() {
        strokes = [];
        ctx.clearRect(0, 0, padWidth, padHeight);
        PenEngine.clear();
      },
      undo: function() {
        strokes.pop(); // Remove current
        if (strokes.length > 0) {
          ctx.putImageData(strokes[strokes.length - 1], 0, 0);
        } else {
          ctx.clearRect(0, 0, padWidth, padHeight);
        }
      },
      toDataURL: function() {
        return canvas.toDataURL('image/png');
      },
      destroy: function() {
        if (rafId) cancelAnimationFrame(rafId);
        canvas.remove();
      },
    };
  }

  // =========================================================================
  // SAVED SIGNATURES — localStorage persistence
  // =========================================================================

  function getSavedSignatures() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function saveSignature(dataUrl, label) {
    var list = getSavedSignatures();
    list.unshift({ data: dataUrl, label: label || 'Signature', created: Date.now() });
    if (list.length > MAX_SAVED) list = list.slice(0, MAX_SAVED);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (_) { /* quota exceeded */ }
    return list;
  }

  function removeSavedSignature(index) {
    var list = getSavedSignatures();
    list.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list;
  }

  // =========================================================================
  // IMAGE IMPORT — load PNG/JPG as signature
  // =========================================================================

  function createImageImport(onLoad) {
    var input = el('input', {
      type: 'file',
      accept: 'image/png,image/jpeg',
      style: { display: 'none' },
    });

    input.addEventListener('change', function() {
      var file = input.files && input.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          // Resize to fit signature area
          var maxW = 460, maxH = 160;
          var scale = Math.min(maxW / img.width, maxH / img.height, 1);
          var canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          onLoad(canvas.toDataURL('image/png'));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
      // Reset so same file can be selected again
      input.value = '';
    });

    return input;
  }

  // =========================================================================
  // OVERLAY — drag & resize signature placement on document
  // =========================================================================

  function createSignatureOverlay(containerEl, signatureDataUrl, onPlace) {
    var overlay = el('div', {
      style: {
        position: 'absolute',
        top: '0', left: '0', right: '0', bottom: '0',
        zIndex: '1000',
        cursor: 'crosshair',
      },
    });

    var sigImg = null;
    var isDragging = false;
    var isResizing = false;
    var startX = 0, startY = 0;
    var sigX = 50, sigY = 50;
    var sigW = 200, sigH = 80;

    function renderSig() {
      if (!sigImg) {
        sigImg = el('div', {
          style: {
            position: 'absolute',
            border: '2px solid #171717',
            borderRadius: '4px',
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            cursor: 'move',
          },
        });

        var img = el('img', {
          src: signatureDataUrl,
          style: {
            width: '100%', height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            userSelect: 'none',
          },
          draggable: 'false',
        });

        var resizeHandle = el('div', {
          style: {
            position: 'absolute',
            right: '0', bottom: '0',
            width: '16px', height: '16px',
            background: '#171717',
            borderRadius: '2px 0 4px 0',
            cursor: 'se-resize',
          },
        });

        var confirmBtn = el('button', {
          style: {
            position: 'absolute',
            top: '-36px', right: '0',
            padding: '6px 16px',
            background: '#171717',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
          },
        }, 'Placer ici');

        confirmBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          var rect = containerEl.getBoundingClientRect();
          onPlace({
            x: sigX / rect.width,
            y: sigY / rect.height,
            width: sigW / rect.width,
            height: sigH / rect.height,
            dataUrl: signatureDataUrl,
          });
          overlay.remove();
        });

        sigImg.appendChild(img);
        sigImg.appendChild(resizeHandle);
        sigImg.appendChild(confirmBtn);
        overlay.appendChild(sigImg);

        // Drag
        sigImg.addEventListener('pointerdown', function(e) {
          if (e.target === resizeHandle) return;
          e.stopPropagation();
          isDragging = true;
          startX = e.clientX - sigX;
          startY = e.clientY - sigY;
          sigImg.setPointerCapture(e.pointerId);
        });

        sigImg.addEventListener('pointermove', function(e) {
          if (!isDragging) return;
          e.stopPropagation();
          sigX = e.clientX - startX;
          sigY = e.clientY - startY;
          updatePosition();
        });

        sigImg.addEventListener('pointerup', function() {
          isDragging = false;
        });

        // Resize
        resizeHandle.addEventListener('pointerdown', function(e) {
          e.stopPropagation();
          isResizing = true;
          startX = e.clientX;
          startY = e.clientY;
          resizeHandle.setPointerCapture(e.pointerId);
        });

        resizeHandle.addEventListener('pointermove', function(e) {
          if (!isResizing) return;
          e.stopPropagation();
          var dx = e.clientX - startX;
          var dy = e.clientY - startY;
          sigW = Math.max(80, sigW + dx);
          sigH = Math.max(30, sigH + dy);
          startX = e.clientX;
          startY = e.clientY;
          updatePosition();
        });

        resizeHandle.addEventListener('pointerup', function() {
          isResizing = false;
        });
      }

      updatePosition();
    }

    function updatePosition() {
      if (!sigImg) return;
      sigImg.style.left = sigX + 'px';
      sigImg.style.top = sigY + 'px';
      sigImg.style.width = sigW + 'px';
      sigImg.style.height = sigH + 'px';
    }

    // Click to place
    overlay.addEventListener('click', function(e) {
      var rect = containerEl.getBoundingClientRect();
      sigX = e.clientX - rect.left - sigW / 2;
      sigY = e.clientY - rect.top - sigH / 2;
      renderSig();
    });

    // Cancel on Escape
    function onKey(e) {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', onKey);
      }
    }
    document.addEventListener('keydown', onKey);

    containerEl.style.position = 'relative';
    containerEl.appendChild(overlay);

    return {
      destroy: function() {
        overlay.remove();
        document.removeEventListener('keydown', onKey);
      },
    };
  }

  // =========================================================================
  // SECURITY — block context menu, drag, copy on signature zones
  // =========================================================================

  function applySecurity() {
    qsa('[data-signature-zone]').forEach(function(zone) {
      zone.addEventListener('contextmenu', function(e) { e.preventDefault(); });
      zone.addEventListener('dragstart', function(e) { e.preventDefault(); });
      zone.addEventListener('copy', function(e) { e.preventDefault(); });
      zone.addEventListener('selectstart', function(e) { e.preventDefault(); });
      zone.style.userSelect = 'none';
      zone.style.webkitUserSelect = 'none';
    });
  }

  // =========================================================================
  // WATERMARK — invisible metadata embedded in the signature image
  // =========================================================================

  function applyWatermark(canvas, signerName, signerEmail, documentHash) {
    var ctx = canvas.getContext('2d');
    var text = [signerName, signerEmail, documentHash, new Date().toISOString()].join('|');

    // Encode as nearly invisible 1px dots
    ctx.fillStyle = 'rgba(0,0,0,0.01)';
    ctx.font = '1px monospace';

    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      var x = (i * 7 + 3) % canvas.width;
      var y = canvas.height - 2;
      // Each character encoded as a pattern of micro-dots
      for (var bit = 0; bit < 8; bit++) {
        if ((code >> bit) & 1) {
          ctx.fillRect(x + bit, y, 1, 1);
        }
      }
    }

    return canvas;
  }

  // =========================================================================
  // MAIN UI — signature modal with 3 tabs (draw / import / saved)
  // =========================================================================

  function openSignatureModal(opts) {
    opts = opts || {};
    var signerName = opts.signerName || '';
    var signerEmail = opts.signerEmail || '';
    var documentHash = opts.documentHash || '';
    var onComplete = opts.onComplete || function() {};
    var onCancel = opts.onCancel || function() {};

    var activeTab = 'draw';
    var pad = null;
    var importedDataUrl = null;
    var selectedSaved = null;
    var fileInput = null;

    // --- Backdrop ---
    var backdrop = el('div', {
      style: {
        position: 'fixed',
        top: '0', left: '0', right: '0', bottom: '0',
        background: 'rgba(0,0,0,0.5)',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    });

    // --- Modal ---
    var modal = el('div', {
      style: {
        background: '#fff',
        borderRadius: '16px',
        width: '520px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      },
    });

    // Header
    var header = el('div', {
      style: {
        padding: '20px 24px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
    }, [
      el('h2', { style: { margin: '0', fontSize: '18px', fontWeight: '700', color: '#171717' } }, 'Votre signature'),
      el('button', {
        style: {
          background: 'none', border: 'none', fontSize: '20px',
          cursor: 'pointer', color: '#737373', padding: '4px',
        },
        onClick: function() { cleanup(); onCancel(); },
      }, '\\u2715'),
    ]);

    // Tabs
    var tabBar = el('div', {
      style: {
        display: 'flex', gap: '4px',
        padding: '16px 24px 0',
      },
    });

    var tabs = ['draw', 'import', 'saved'];
    var tabLabels = { draw: 'Dessiner', import: 'Importer', saved: 'Mes signatures' };
    var tabButtons = {};

    tabs.forEach(function(tabId) {
      var btn = el('button', {
        style: {
          padding: '8px 16px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 150ms',
        },
        onClick: function() { switchTab(tabId); },
      }, tabLabels[tabId]);
      tabButtons[tabId] = btn;
      tabBar.appendChild(btn);
    });

    // Body
    var body = el('div', { style: { padding: '16px 24px 24px' } });

    // Footer
    var footer = el('div', {
      style: {
        padding: '0 24px 20px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
      },
    });

    var cancelBtn = el('button', {
      style: {
        padding: '10px 20px', border: '1px solid #e5e5e5',
        borderRadius: '8px', background: '#fff', fontSize: '13px',
        fontWeight: '500', cursor: 'pointer', color: '#525252',
      },
      onClick: function() { cleanup(); onCancel(); },
    }, 'Annuler');

    var validateBtn = el('button', {
      style: {
        padding: '10px 20px', border: 'none',
        borderRadius: '8px', background: '#171717', color: '#fff',
        fontSize: '13px', fontWeight: '600', cursor: 'pointer',
      },
      onClick: handleValidate,
    }, 'Valider la signature');

    footer.appendChild(cancelBtn);
    footer.appendChild(validateBtn);

    modal.appendChild(header);
    modal.appendChild(tabBar);
    modal.appendChild(body);
    modal.appendChild(footer);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Close on backdrop click
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) { cleanup(); onCancel(); }
    });

    // File input for import tab
    fileInput = createImageImport(function(dataUrl) {
      importedDataUrl = dataUrl;
      switchTab('import');
    });
    document.body.appendChild(fileInput);

    // Init
    switchTab('draw');
    updateTabStyles();
    applySecurity();

    // --- Tab switching ---
    function switchTab(tabId) {
      activeTab = tabId;
      updateTabStyles();
      renderBody();
    }

    function updateTabStyles() {
      tabs.forEach(function(id) {
        var btn = tabButtons[id];
        if (id === activeTab) {
          btn.style.background = '#171717';
          btn.style.color = '#fff';
        } else {
          btn.style.background = '#f5f5f5';
          btn.style.color = '#525252';
        }
      });
    }

    function renderBody() {
      body.innerHTML = '';

      if (activeTab === 'draw') {
        renderDrawTab();
      } else if (activeTab === 'import') {
        renderImportTab();
      } else if (activeTab === 'saved') {
        renderSavedTab();
      }
    }

    // --- Draw tab ---
    function renderDrawTab() {
      if (pad) pad.destroy();
      var padContainer = el('div');
      pad = createSignaturePad(padContainer, { width: 460, height: 160, color: '#171717' });
      body.appendChild(padContainer);

      var toolbar = el('div', {
        style: { display: 'flex', gap: '8px', marginTop: '8px' },
      });

      toolbar.appendChild(el('button', {
        style: {
          padding: '6px 12px', border: '1px solid #e5e5e5', borderRadius: '6px',
          background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#525252',
        },
        onClick: function() { pad.undo(); },
      }, 'Annuler trait'));

      toolbar.appendChild(el('button', {
        style: {
          padding: '6px 12px', border: '1px solid #fecaca', borderRadius: '6px',
          background: '#fef2f2', fontSize: '12px', cursor: 'pointer', color: '#dc2626',
        },
        onClick: function() { pad.clear(); },
      }, 'Effacer tout'));

      body.appendChild(toolbar);
    }

    // --- Import tab ---
    function renderImportTab() {
      if (importedDataUrl) {
        var preview = el('div', {
          style: {
            border: '2px dashed #d4d4d4', borderRadius: '8px',
            padding: '16px', textAlign: 'center', background: '#fafafa',
          },
        });
        var img = el('img', {
          src: importedDataUrl,
          style: { maxWidth: '100%', maxHeight: '140px', objectFit: 'contain' },
          draggable: 'false',
        });
        preview.appendChild(img);

        var changeBtn = el('button', {
          style: {
            marginTop: '8px', padding: '6px 12px', border: '1px solid #e5e5e5',
            borderRadius: '6px', background: '#fff', fontSize: '12px',
            cursor: 'pointer', color: '#525252',
          },
          onClick: function() { fileInput.click(); },
        }, 'Changer l\\u2019image');

        body.appendChild(preview);
        body.appendChild(changeBtn);
      } else {
        var dropzone = el('div', {
          style: {
            border: '2px dashed #d4d4d4', borderRadius: '12px',
            padding: '40px 20px', textAlign: 'center', cursor: 'pointer',
            background: '#fafafa', transition: 'border-color 150ms',
          },
          onClick: function() { fileInput.click(); },
        }, [
          el('p', { style: { margin: '0 0 4px', fontWeight: '500', color: '#171717', fontSize: '14px' } },
            'Cliquez ou glissez une image'),
          el('p', { style: { margin: '0', color: '#a3a3a3', fontSize: '12px' } },
            'PNG ou JPG, max 2 Mo'),
        ]);

        // Drag & drop
        dropzone.addEventListener('dragover', function(e) {
          e.preventDefault();
          dropzone.style.borderColor = '#171717';
        });
        dropzone.addEventListener('dragleave', function() {
          dropzone.style.borderColor = '#d4d4d4';
        });
        dropzone.addEventListener('drop', function(e) {
          e.preventDefault();
          dropzone.style.borderColor = '#d4d4d4';
          var file = e.dataTransfer && e.dataTransfer.files[0];
          if (file && file.type.startsWith('image/')) {
            var reader = new FileReader();
            reader.onload = function(ev) { importedDataUrl = ev.target.result; renderBody(); };
            reader.readAsDataURL(file);
          }
        });

        body.appendChild(dropzone);
      }
    }

    // --- Saved tab ---
    function renderSavedTab() {
      var saved = getSavedSignatures();
      if (saved.length === 0) {
        body.appendChild(el('p', {
          style: { textAlign: 'center', color: '#a3a3a3', padding: '40px 0', fontSize: '14px' },
        }, 'Aucune signature sauvegardee'));
        return;
      }

      var list = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } });

      saved.forEach(function(sig, idx) {
        var item = el('div', {
          style: {
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px', border: '2px solid ' + (selectedSaved === idx ? '#171717' : '#e5e5e5'),
            borderRadius: '8px', cursor: 'pointer', transition: 'border-color 150ms',
          },
          onClick: function() { selectedSaved = idx; renderBody(); },
        });

        var img = el('img', {
          src: sig.data,
          style: { width: '120px', height: '50px', objectFit: 'contain', borderRadius: '4px' },
          draggable: 'false',
        });

        var meta = el('div', { style: { flex: '1' } }, [
          el('p', { style: { margin: '0', fontSize: '13px', fontWeight: '500', color: '#171717' } }, sig.label),
          el('p', { style: { margin: '2px 0 0', fontSize: '11px', color: '#a3a3a3' } },
            new Date(sig.created).toLocaleDateString('fr-FR')),
        ]);

        var delBtn = el('button', {
          style: {
            background: 'none', border: 'none', color: '#dc2626',
            cursor: 'pointer', fontSize: '16px', padding: '4px',
          },
          onClick: function(e) {
            e.stopPropagation();
            removeSavedSignature(idx);
            if (selectedSaved === idx) selectedSaved = null;
            renderBody();
          },
        }, '\\u2715');

        item.appendChild(img);
        item.appendChild(meta);
        item.appendChild(delBtn);
        list.appendChild(item);
      });

      body.appendChild(list);
    }

    // --- Validate ---
    function handleValidate() {
      var dataUrl = null;

      if (activeTab === 'draw') {
        if (!pad || pad.isEmpty()) return;
        dataUrl = pad.toDataURL();
        saveSignature(dataUrl, 'Signature du ' + new Date().toLocaleDateString('fr-FR'));
      } else if (activeTab === 'import') {
        if (!importedDataUrl) return;
        dataUrl = importedDataUrl;
      } else if (activeTab === 'saved') {
        var saved = getSavedSignatures();
        if (selectedSaved === null || !saved[selectedSaved]) return;
        dataUrl = saved[selectedSaved].data;
      }

      if (!dataUrl) return;

      // Apply watermark
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        applyWatermark(canvas, signerName, signerEmail, documentHash);
        var finalUrl = canvas.toDataURL('image/png');
        cleanup();
        onComplete(finalUrl);
      };
      img.src = dataUrl;
    }

    // --- Cleanup ---
    function cleanup() {
      if (pad) pad.destroy();
      if (fileInput) fileInput.remove();
      backdrop.remove();
    }
  }

  // =========================================================================
  // PUBLIC API — exposed on window for the packaged HTML to call
  // =========================================================================

  window.__ADVIST_SIGNATURE = {
    openModal: openSignatureModal,
    placeOnDocument: createSignatureOverlay,
    getSaved: getSavedSignatures,
    saveSig: saveSignature,
    removeSaved: removeSavedSignature,
    sha256: sha256,
  };

  // Auto-init: apply security on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySecurity);
  } else {
    applySecurity();
  }

})();
`;

export default SIGNATURE_SCRIPT;
