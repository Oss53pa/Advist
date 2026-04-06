-- Collaboration Sessions
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Collaboration Presence
CREATE TABLE IF NOT EXISTS collaboration_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    cursor_position JSONB,
    last_seen_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    left_at TIMESTAMPTZ,
    UNIQUE(session_id, user_id)
);

-- Collaboration Chat Messages
CREATE TABLE IF NOT EXISTS collaboration_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Collaboration Cursors (real-time cursor positions)
CREATE TABLE IF NOT EXISTS collaboration_cursors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    page_number INTEGER,
    x_position FLOAT,
    y_position FLOAT,
    color VARCHAR(7),
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(session_id, user_id)
);

-- Document Shares (share by link)
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    access_type share_access_type DEFAULT 'view',
    password_hash TEXT,
    max_downloads INTEGER,
    download_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
