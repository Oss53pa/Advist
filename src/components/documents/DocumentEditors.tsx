import React, { useState, useRef, useEffect } from 'react';
import { sanitizeHtml } from '../../utils/sanitize';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Image,
  Table,
  Undo,
  Redo,
  Save,
  FileText,
  Type,
  Palette,
  Plus,
  Minus,
  Lock,
  Unlock,
  Calculator,
  ChevronDown,
} from 'lucide-react';
import { Button, Badge } from '../ui';

// ============================================
// WORD EDITOR COMPONENT
// ============================================

interface WordEditorProps {
  content?: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
}

export const WordEditor: React.FC<WordEditorProps> = ({
  content = '',
  onSave,
  readOnly = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isModified, setIsModified] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);

  const fontSizes = [10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    setIsModified(true);
  };

  const handleSave = () => {
    if (editorRef.current && onSave) {
      onSave(editorRef.current.innerHTML);
      setIsModified(false);
    }
  };

  // Initial content
  const defaultContent = `
    <h1 style="text-align: center; color: #1a1a1a;">CONTRAT DE PRESTATION DE SERVICES</h1>
    <p style="text-align: center; color: #666;">Année 2024 - Quatrième Trimestre</p>
    <br/>
    <p><strong>ENTRE LES SOUSSIGNÉS :</strong></p>
    <p><strong>ADVIST SARL</strong>, société à responsabilité limitée au capital de 100 000 €, immatriculée au RCS sous le numéro 123 456 789, dont le siège social est situé à Abidjan, Côte d'Ivoire,</p>
    <p>Représentée par Mme Marie DUPONT, en sa qualité de Directrice Générale,</p>
    <p>Ci-après dénommée <strong>« Le Prestataire »</strong></p>
    <br/>
    <p><strong>ET</strong></p>
    <br/>
    <p><strong>TECHCORP SA</strong>, société anonyme au capital de 500 000 €, immatriculée au RCS sous le numéro 987 654 321,</p>
    <p>Représentée par M. Jean MARTIN, en sa qualité de Directeur Général,</p>
    <p>Ci-après dénommée <strong>« Le Client »</strong></p>
    <br/>
    <h2>ARTICLE 1 - OBJET</h2>
    <p>Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire s'engage à fournir au Client les services suivants :</p>
    <ul>
      <li>Conseil en gestion documentaire</li>
      <li>Mise en place d'un système GED</li>
      <li>Formation des équipes</li>
      <li>Support technique</li>
    </ul>
    <br/>
    <h2>ARTICLE 2 - DURÉE</h2>
    <p>Le présent contrat est conclu pour une durée de <strong>3 mois</strong>, du 1er octobre 2024 au 31 décembre 2024.</p>
    <br/>
    <h2>ARTICLE 3 - PRIX ET MODALITÉS DE PAIEMENT</h2>
    <p>Le montant total de la prestation s'élève à <strong>45 000 €</strong> HT, payable selon l'échéancier suivant :</p>
    <ol>
      <li>30% à la signature du contrat</li>
      <li>40% à mi-parcours</li>
      <li>30% à la livraison finale</li>
    </ol>
  `;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      {!readOnly && (
        <div className="border-b border-advist-border bg-advist-surface-dark p-2">
          {/* Row 1: Main actions */}
          <div className="flex items-center gap-1 flex-wrap">
            {/* Save */}
            <Button
              variant={isModified ? 'primary' : 'ghost'}
              size="sm"
              onClick={handleSave}
              leftIcon={<Save size={16} />}
            >
              {isModified ? 'Enregistrer*' : 'Enregistrer'}
            </Button>

            <div className="w-px h-6 bg-advist-surface-dark mx-2" />

            {/* Undo/Redo */}
            <button
              onClick={() => execCommand('undo')}
              className="p-2 hover:bg-advist-border rounded"
              title="Annuler"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={() => execCommand('redo')}
              className="p-2 hover:bg-advist-border rounded"
              title="Rétablir"
            >
              <Redo size={16} />
            </button>

            <div className="w-px h-6 bg-advist-surface-dark mx-2" />

            {/* Font Size */}
            <div className="relative">
              <button
                onClick={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
                className="flex items-center gap-1 px-2 py-1.5 hover:bg-advist-border rounded border border-advist-border bg-white"
              >
                <span className="text-sm w-8">{fontSize}</span>
                <ChevronDown size={14} />
              </button>
              {showFontSizeDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-advist-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {fontSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setFontSize(size);
                        execCommand('fontSize', '7');
                        // Apply custom font size via span
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                          const range = selection.getRangeAt(0);
                          const span = document.createElement('span');
                          span.style.fontSize = `${size}px`;
                          range.surroundContents(span);
                        }
                        setShowFontSizeDropdown(false);
                      }}
                      className={`block w-full px-4 py-1.5 text-left hover:bg-advist-surface-dark ${
                        fontSize === size ? 'bg-advist-gold-light text-advist-gray900' : ''
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-advist-surface-dark mx-2" />

            {/* Text Formatting */}
            <button
              onClick={() => execCommand('bold')}
              className="p-2 hover:bg-advist-border rounded font-bold"
              title="Gras"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => execCommand('italic')}
              className="p-2 hover:bg-advist-border rounded italic"
              title="Italique"
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => execCommand('underline')}
              className="p-2 hover:bg-advist-border rounded underline"
              title="Souligné"
            >
              <Underline size={16} />
            </button>

            <div className="w-px h-6 bg-advist-surface-dark mx-2" />

            {/* Headings */}
            <button
              onClick={() => execCommand('formatBlock', 'h1')}
              className="p-2 hover:bg-advist-border rounded"
              title="Titre 1"
            >
              <Heading1 size={16} />
            </button>
            <button
              onClick={() => execCommand('formatBlock', 'h2')}
              className="p-2 hover:bg-advist-border rounded"
              title="Titre 2"
            >
              <Heading2 size={16} />
            </button>
            <button
              onClick={() => execCommand('formatBlock', 'h3')}
              className="p-2 hover:bg-advist-border rounded"
              title="Titre 3"
            >
              <Heading3 size={16} />
            </button>

            <div className="w-px h-6 bg-advist-surface-dark mx-2" />

            {/* Alignment */}
            <button
              onClick={() => execCommand('justifyLeft')}
              className="p-2 hover:bg-advist-border rounded"
              title="Aligner à gauche"
            >
              <AlignLeft size={16} />
            </button>
            <button
              onClick={() => execCommand('justifyCenter')}
              className="p-2 hover:bg-advist-border rounded"
              title="Centrer"
            >
              <AlignCenter size={16} />
            </button>
            <button
              onClick={() => execCommand('justifyRight')}
              className="p-2 hover:bg-advist-border rounded"
              title="Aligner à droite"
            >
              <AlignRight size={16} />
            </button>
            <button
              onClick={() => execCommand('justifyFull')}
              className="p-2 hover:bg-advist-border rounded"
              title="Justifier"
            >
              <AlignJustify size={16} />
            </button>

            <div className="w-px h-6 bg-advist-surface-dark mx-2" />

            {/* Lists */}
            <button
              onClick={() => execCommand('insertUnorderedList')}
              className="p-2 hover:bg-advist-border rounded"
              title="Liste à puces"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => execCommand('insertOrderedList')}
              className="p-2 hover:bg-advist-border rounded"
              title="Liste numérotée"
            >
              <ListOrdered size={16} />
            </button>

            <div className="w-px h-6 bg-advist-surface-dark mx-2" />

            {/* Insert */}
            <button
              onClick={() => {
                const url = prompt('URL du lien:');
                if (url) execCommand('createLink', url);
              }}
              className="p-2 hover:bg-advist-border rounded"
              title="Insérer un lien"
            >
              <Link size={16} />
            </button>
            <button
              onClick={() => {
                const url = prompt('URL de l\'image:');
                if (url) execCommand('insertImage', url);
              }}
              className="p-2 hover:bg-advist-border rounded"
              title="Insérer une image"
            >
              <Image size={16} />
            </button>
            <button
              onClick={() => execCommand('insertHTML', '<table border="1" style="border-collapse: collapse; width: 100%;"><tr><td style="padding: 8px;">Cellule 1</td><td style="padding: 8px;">Cellule 2</td></tr><tr><td style="padding: 8px;">Cellule 3</td><td style="padding: 8px;">Cellule 4</td></tr></table>')}
              className="p-2 hover:bg-advist-border rounded"
              title="Insérer un tableau"
            >
              <Table size={16} />
            </button>

            <div className="w-px h-6 bg-advist-surface-dark mx-2" />

            {/* Text Color */}
            <div className="relative">
              <input
                type="color"
                onChange={(e) => execCommand('foreColor', e.target.value)}
                className="w-8 h-8 p-0 border-0 cursor-pointer"
                title="Couleur du texte"
              />
            </div>
            <div className="relative">
              <input
                type="color"
                onChange={(e) => execCommand('hiliteColor', e.target.value)}
                className="w-8 h-8 p-0 border-0 cursor-pointer"
                title="Couleur de surlignage"
                defaultValue="#FFFF00"
              />
            </div>
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 overflow-auto bg-advist-surface-dark p-8">
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          className="max-w-[800px] mx-auto bg-white shadow-lg min-h-[1000px] p-16 outline-none"
          style={{
            fontFamily: 'Times New Roman, serif',
            fontSize: `${fontSize}px`,
            lineHeight: '1.6',
          }}
          onInput={() => setIsModified(true)}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content || defaultContent) }}
          suppressContentEditableWarning
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-advist-surface-dark border-t border-advist-border text-xs text-advist-text-secondary">
        <div className="flex items-center gap-4">
          <span>Mode: {readOnly ? 'Lecture seule' : 'Édition'}</span>
          {isModified && <Badge variant="warning" size="sm">Modifications non enregistrées</Badge>}
        </div>
        <div className="flex items-center gap-4">
          <span>Format: DOCX</span>
          <span>Zoom: 100%</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// EXCEL EDITOR COMPONENT
// ============================================

interface ExcelCell {
  value: string;
  formula?: string;
  isFormula: boolean;
  format?: 'text' | 'number' | 'currency' | 'percentage' | 'date';
  style?: {
    bold?: boolean;
    italic?: boolean;
    backgroundColor?: string;
    textColor?: string;
    align?: 'left' | 'center' | 'right';
  };
}

interface ExcelEditorProps {
  data?: ExcelCell[][];
  onSave?: (data: ExcelCell[][]) => void;
  readOnly?: boolean;
}

// Sample spreadsheet data
const generateSampleData = (): ExcelCell[][] => {
  const data: ExcelCell[][] = [];

  // Headers row
  data.push([
    { value: 'Description', isFormula: false, style: { bold: true, backgroundColor: '#E5E7EB' } },
    { value: 'Quantité', isFormula: false, style: { bold: true, backgroundColor: '#E5E7EB', align: 'center' } },
    { value: 'Prix Unitaire', isFormula: false, style: { bold: true, backgroundColor: '#E5E7EB', align: 'right' } },
    { value: 'Total', isFormula: false, style: { bold: true, backgroundColor: '#E5E7EB', align: 'right' } },
    { value: 'Notes', isFormula: false, style: { bold: true, backgroundColor: '#E5E7EB' } },
  ]);

  // Data rows
  const items = [
    { desc: 'Licence logiciel GED', qty: '5', price: '1200', notes: 'Licence annuelle' },
    { desc: 'Formation utilisateurs', qty: '2', price: '800', notes: 'Sessions de 2 jours' },
    { desc: 'Installation serveur', qty: '1', price: '2500', notes: '' },
    { desc: 'Configuration workflow', qty: '3', price: '600', notes: 'Workflows personnalisés' },
    { desc: 'Support premium', qty: '12', price: '150', notes: 'Mois' },
    { desc: 'Migration données', qty: '1', price: '3000', notes: '' },
  ];

  items.forEach((item, idx) => {
    const rowNum = idx + 2;
    data.push([
      { value: item.desc, isFormula: false },
      { value: item.qty, isFormula: false, format: 'number', style: { align: 'center' } },
      { value: item.price, isFormula: false, format: 'currency', style: { align: 'right' } },
      { value: (parseInt(item.qty) * parseInt(item.price)).toString(), formula: `=B${rowNum}*C${rowNum}`, isFormula: true, format: 'currency', style: { align: 'right', backgroundColor: '#FEF3C7' } },
      { value: item.notes, isFormula: false },
    ]);
  });

  // Empty rows
  for (let i = 0; i < 3; i++) {
    data.push([
      { value: '', isFormula: false },
      { value: '', isFormula: false, style: { align: 'center' } },
      { value: '', isFormula: false, style: { align: 'right' } },
      { value: '', formula: `=B${items.length + 2 + i}*C${items.length + 2 + i}`, isFormula: true, style: { align: 'right', backgroundColor: '#FEF3C7' } },
      { value: '', isFormula: false },
    ]);
  }

  // Total row
  const totalRowNum = items.length + 5;
  data.push([
    { value: 'TOTAL HT', isFormula: false, style: { bold: true, backgroundColor: '#DBEAFE' } },
    { value: '', isFormula: false, style: { backgroundColor: '#DBEAFE' } },
    { value: '', isFormula: false, style: { backgroundColor: '#DBEAFE' } },
    { value: '14800', formula: `=SOMME(D2:D${totalRowNum - 1})`, isFormula: true, format: 'currency', style: { bold: true, align: 'right', backgroundColor: '#DBEAFE' } },
    { value: '', isFormula: false, style: { backgroundColor: '#DBEAFE' } },
  ]);

  // TVA row
  data.push([
    { value: 'TVA (20%)', isFormula: false, style: { backgroundColor: '#F3F4F6' } },
    { value: '', isFormula: false, style: { backgroundColor: '#F3F4F6' } },
    { value: '', isFormula: false, style: { backgroundColor: '#F3F4F6' } },
    { value: '2960', formula: `=D${totalRowNum}*0.20`, isFormula: true, format: 'currency', style: { align: 'right', backgroundColor: '#F3F4F6' } },
    { value: '', isFormula: false, style: { backgroundColor: '#F3F4F6' } },
  ]);

  // Total TTC row
  data.push([
    { value: 'TOTAL TTC', isFormula: false, style: { bold: true, backgroundColor: '#10B981', textColor: 'white' } },
    { value: '', isFormula: false, style: { backgroundColor: '#10B981' } },
    { value: '', isFormula: false, style: { backgroundColor: '#10B981' } },
    { value: '17760', formula: `=D${totalRowNum}+D${totalRowNum + 1}`, isFormula: true, format: 'currency', style: { bold: true, align: 'right', backgroundColor: '#10B981', textColor: 'white' } },
    { value: '', isFormula: false, style: { backgroundColor: '#10B981' } },
  ]);

  return data;
};

export const ExcelEditor: React.FC<ExcelEditorProps> = ({
  data: initialData,
  onSave,
  readOnly = false,
}) => {
  const [data, setData] = useState<ExcelCell[][]>(initialData || generateSampleData());
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [showFormulaBar, setShowFormulaBar] = useState(true);

  const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const columnWidths = [200, 100, 120, 120, 200, 100, 100, 100];

  const handleCellChange = (rowIndex: number, colIndex: number, newValue: string) => {
    const cell = data[rowIndex][colIndex];

    // Don't allow editing formula cells
    if (cell.isFormula) return;

    const newData = [...data];
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = { ...cell, value: newValue };

    setData(newData);
    setIsModified(true);

    // Recalculate formulas (simplified)
    recalculateFormulas(newData);
  };

  const recalculateFormulas = (currentData: ExcelCell[][]) => {
    // This is a simplified formula recalculation
    // In a real implementation, you'd use a proper formula parser
    const newData = currentData.map((row, rowIdx) =>
      row.map((cell, colIdx) => {
        if (cell.isFormula && cell.formula) {
          // Simple multiplication formula: =B2*C2
          const match = cell.formula.match(/=([A-Z])(\d+)\*([A-Z])(\d+)/);
          if (match) {
            const col1 = match[1].charCodeAt(0) - 65;
            const row1 = parseInt(match[2]) - 1;
            const col2 = match[3].charCodeAt(0) - 65;
            const row2 = parseInt(match[4]) - 1;

            const val1 = parseFloat(currentData[row1]?.[col1]?.value || '0') || 0;
            const val2 = parseFloat(currentData[row2]?.[col2]?.value || '0') || 0;

            return { ...cell, value: (val1 * val2).toString() };
          }
        }
        return cell;
      })
    );

    setData(newData);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(data);
      setIsModified(false);
    }
  };

  const formatCellValue = (cell: ExcelCell): string => {
    if (!cell.value) return '';

    const numValue = parseFloat(cell.value);

    switch (cell.format) {
      case 'currency':
        return isNaN(numValue) ? cell.value : `${numValue.toLocaleString('fr-FR')} €`;
      case 'percentage':
        return isNaN(numValue) ? cell.value : `${numValue}%`;
      case 'number':
        return isNaN(numValue) ? cell.value : numValue.toLocaleString('fr-FR');
      default:
        return cell.value;
    }
  };

  const getCellStyle = (cell: ExcelCell): React.CSSProperties => {
    return {
      fontWeight: cell.style?.bold ? 'bold' : 'normal',
      fontStyle: cell.style?.italic ? 'italic' : 'normal',
      backgroundColor: cell.style?.backgroundColor || 'white',
      color: cell.style?.textColor || '#1a1a1a',
      textAlign: cell.style?.align || 'left',
    };
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      {!readOnly && (
        <div className="border-b border-advist-border bg-advist-surface-dark p-2">
          <div className="flex items-center gap-1 flex-wrap">
            {/* Save */}
            <Button
              variant={isModified ? 'primary' : 'ghost'}
              size="sm"
              onClick={handleSave}
              leftIcon={<Save size={16} />}
            >
              {isModified ? 'Enregistrer*' : 'Enregistrer'}
            </Button>

            <div className="w-px h-6 bg-advist-surface-dark mx-2" />

            {/* Undo/Redo */}
            <button className="p-2 hover:bg-advist-border rounded" title="Annuler">
              <Undo size={16} />
            </button>
            <button className="p-2 hover:bg-advist-border rounded" title="Rétablir">
              <Redo size={16} />
            </button>

            <div className="w-px h-6 bg-advist-surface-dark mx-2" />

            {/* Formatting */}
            <button className="p-2 hover:bg-advist-border rounded font-bold" title="Gras">
              <Bold size={16} />
            </button>
            <button className="p-2 hover:bg-advist-border rounded italic" title="Italique">
              <Italic size={16} />
            </button>

            <div className="w-px h-6 bg-advist-surface-dark mx-2" />

            {/* Alignment */}
            <button className="p-2 hover:bg-advist-border rounded" title="Aligner à gauche">
              <AlignLeft size={16} />
            </button>
            <button className="p-2 hover:bg-advist-border rounded" title="Centrer">
              <AlignCenter size={16} />
            </button>
            <button className="p-2 hover:bg-advist-border rounded" title="Aligner à droite">
              <AlignRight size={16} />
            </button>

            <div className="w-px h-6 bg-advist-surface-dark mx-2" />

            {/* Row/Column operations */}
            <button className="flex items-center gap-1 px-2 py-1.5 hover:bg-advist-border rounded text-sm" title="Insérer une ligne">
              <Plus size={14} />
              Ligne
            </button>
            <button className="flex items-center gap-1 px-2 py-1.5 hover:bg-advist-border rounded text-sm" title="Insérer une colonne">
              <Plus size={14} />
              Colonne
            </button>

            <div className="flex-1" />

            {/* Info */}
            <div className="flex items-center gap-2 text-sm text-advist-text-secondary">
              <div className="flex items-center gap-1 px-2 py-1 bg-advist-gold-light text-advist-gold-dark rounded">
                <Lock size={14} />
                <span>Cellules jaunes = Formules (non modifiables)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formula Bar */}
      {showFormulaBar && selectedCell && (
        <div className="flex items-center gap-2 px-4 py-2 bg-advist-surface-dark border-b border-advist-border">
          <span className="font-mono text-sm bg-white px-2 py-1 border border-advist-border rounded min-w-[60px] text-center">
            {columns[selectedCell.col]}{selectedCell.row + 1}
          </span>
          <Calculator size={16} className="text-advist-text-muted" />
          <div className="flex-1 font-mono text-sm bg-white px-3 py-1 border border-advist-border rounded">
            {data[selectedCell.row]?.[selectedCell.col]?.formula || data[selectedCell.row]?.[selectedCell.col]?.value || ''}
          </div>
        </div>
      )}

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-advist-surface-dark">
              {/* Row number header */}
              <th className="w-12 min-w-[48px] border border-advist-border bg-advist-border text-xs text-advist-text-secondary font-normal py-1" />
              {/* Column headers */}
              {columns.slice(0, data[0]?.length || 5).map((col, idx) => (
                <th
                  key={col}
                  className="border border-advist-border bg-advist-border text-xs text-advist-text-secondary font-medium py-1 px-2"
                  style={{ width: columnWidths[idx] }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {/* Row number */}
                <td className="border border-advist-border bg-advist-surface-dark text-xs text-advist-text-secondary text-center py-1 font-medium">
                  {rowIndex + 1}
                </td>
                {/* Cells */}
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className={`border border-advist-border relative ${
                      selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                        ? 'ring-2 ring-primary-500 ring-inset'
                        : ''
                    } ${cell.isFormula ? 'cursor-not-allowed' : 'cursor-cell'}`}
                    style={{ ...getCellStyle(cell), minWidth: columnWidths[colIndex] }}
                    onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                  >
                    {cell.isFormula ? (
                      <div className="px-2 py-1 flex items-center justify-between">
                        <span style={{ textAlign: cell.style?.align }}>{formatCellValue(cell)}</span>
                        <Lock size={12} className="text-advist-gold flex-shrink-0 ml-1" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={cell.value}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        disabled={readOnly}
                        className="w-full px-2 py-1 bg-transparent border-0 outline-none"
                        style={{ textAlign: cell.style?.align }}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-advist-surface-dark border-t border-advist-border text-xs text-advist-text-secondary">
        <div className="flex items-center gap-4">
          <span>Mode: {readOnly ? 'Lecture seule' : 'Édition'}</span>
          {isModified && <Badge variant="warning" size="sm">Modifications non enregistrées</Badge>}
        </div>
        <div className="flex items-center gap-4">
          <span>Format: XLSX</span>
          <span>Feuille 1 / 1</span>
          {selectedCell && (
            <span>
              Cellule: {columns[selectedCell.col]}{selectedCell.row + 1}
              {data[selectedCell.row]?.[selectedCell.col]?.isFormula && ' (Formule)'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// DOCUMENT TYPE SELECTOR
// ============================================

export type DocumentType = 'pdf' | 'word' | 'excel' | 'image';

export const getDocumentType = (filename: string): DocumentType => {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'doc':
    case 'docx':
    case 'odt':
    case 'rtf':
      return 'word';
    case 'xls':
    case 'xlsx':
    case 'ods':
    case 'csv':
      return 'excel';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return 'image';
    default:
      return 'pdf';
  }
};
