// Sidebar Component Logic
export function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return; // Should likely error or warn

    fetch('components/sidebar/sidebar.html')
        .then(response => response.text())
        .then(html => {
            container.innerHTML = html;
            initSidebarInteraction();
        })
        .catch(err => console.error('Failed to load sidebar:', err));
}

function initSidebarInteraction() {
    // We scope these searches to ensure we get the sidebar's elements, not the main page's
    const sidebarContainer = document.getElementById('sidebar-container');
    const sidebar = sidebarContainer.querySelector('.sidebar');
    const menuIcon = sidebarContainer.querySelector('.menu-icon'); // Scoped to sidebar

    // Mobile menu icon (in main content) also triggers sidebar
    const mobileMenuIcon = document.getElementById('mobile-menu-icon');

    const overlay = document.getElementById('sidebar-overlay');
    const newChatBtn = sidebarContainer.querySelector('.new-chat-btn');
    const settingsBtn = document.getElementById('settings-item');
    const activityBtn = document.getElementById('activity-item');

    // Toggle Sidebar (Sidebar's own toggle)
    if (menuIcon && sidebar) {
        menuIcon.addEventListener('click', () => {
            const isActive = sidebar.classList.toggle('active');
            document.body.classList.toggle('sidebar-active', isActive);
            if (overlay) overlay.classList.toggle('active', isActive);
        });
    }

    // Toggle Sidebar (Mobile Header toggle)
    if (mobileMenuIcon && sidebar) {
        mobileMenuIcon.addEventListener('click', () => {
            const isActive = sidebar.classList.toggle('active');
            document.body.classList.toggle('sidebar-active', isActive);
            if (overlay) overlay.classList.toggle('active', isActive);
        });
    }

    // Close when clicking overlay (mobile mostly)
    if (overlay && sidebar) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            document.body.classList.remove('sidebar-active');
            overlay.classList.remove('active');
        });
    }

    // Auto-close on mobile when clicking any bottom item
    sidebarContainer.querySelectorAll('.bottom-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 900) {
                sidebar.classList.remove('active');
                document.body.classList.remove('sidebar-active');
                if (overlay) overlay.classList.remove('active');
            }
        });
    });

    // New Chat
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            // Dispatch event for main app to handle
            window.dispatchEvent(new CustomEvent('new-chat-requested'));
            // Also close sidebar on mobile if needed
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    }

    // Settings
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            if (typeof window.openSettings === 'function') {
                window.openSettings();
            } else {
                // Fallback for older logic if openSettings isn't available yet
                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal) {
                    settingsModal.style.display = 'flex';
                }
            }
        });
    }

    // Activity
    if (activityBtn) {
        activityBtn.addEventListener('click', () => {
            const activityModal = document.getElementById('activity-modal');
            if (activityModal) activityModal.style.display = 'block';
        });
    }

    // --- RECENT LIST PERSISTENCE LOGIC ---
    const recentItemsContainer = sidebarContainer.querySelector('#recent-items-container');
    const clearAllBtn = sidebarContainer.querySelector('#clear-all-sessions');

    // Create session menu once
    let sessionMenu = document.getElementById('session-context-menu');
    if (!sessionMenu) {
        sessionMenu = document.createElement('div');
        sessionMenu.id = 'session-context-menu';
        sessionMenu.className = 'session-menu';
        sessionMenu.innerHTML = `
            <div class="session-menu-item delete" id="menu-delete-session">
                <span class="material-symbols-outlined">delete</span>
                <span>Delete chat</span>
            </div>
        `;
        document.body.appendChild(sessionMenu);
    }

    let activeMenuSessionId = null;

    function renderRecentList(sessions) {
        if (!recentItemsContainer) return;

        recentItemsContainer.innerHTML = '';

        // Convert sessions object to array and sort by lastUpdate
        const sessionsArray = Object.entries(sessions).map(([id, data]) => ({
            id,
            ...data
        })).sort((a, b) => b.lastUpdate - a.lastUpdate);

        if (sessionsArray.length === 0) {
            recentItemsContainer.innerHTML = '<p style="padding: 10px 14px; font-size: 12px; opacity: 0.5;">No recent chats</p>';
            return;
        }

        sessionsArray.forEach(session => {
            const item = document.createElement('div');
            item.classList.add('recent-item');
            item.dataset.id = session.id;

            // Highlight active session
            const currentId = localStorage.getItem('dinku_current_session_id');
            if (session.id === currentId) {
                item.classList.add('active');
            }

            item.innerHTML = `
                <span class="material-symbols-outlined">chat_bubble</span>
                <span class="text">${session.title || 'Untitled Chat'}</span>
                <button class="session-options-btn" title="Options">
                    <span class="material-symbols-outlined">more_vert</span>
                </button>
            `;

            // Set tooltip for collapsed view
            item.title = session.title || 'Untitled Chat';

            // Click session to load
            item.addEventListener('click', (e) => {
                if (e.target.closest('.session-options-btn')) return;

                // Dispatch load event
                window.dispatchEvent(new CustomEvent('load-session', { detail: session.id }));

                // Update active state in UI
                recentItemsContainer.querySelectorAll('.recent-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Auto-close on mobile
                if (window.innerWidth <= 900) {
                    sidebar.classList.remove('active');
                    document.body.classList.remove('sidebar-active');
                    if (overlay) overlay.classList.remove('active');
                }
            });

            // Options button click
            const optionsBtn = item.querySelector('.session-options-btn');
            optionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                activeMenuSessionId = session.id;

                const rect = optionsBtn.getBoundingClientRect();
                sessionMenu.style.top = `${rect.bottom + 5}px`;
                sessionMenu.style.left = `${rect.right - 140}px`;
                sessionMenu.classList.add('active');
            });

            recentItemsContainer.appendChild(item);
        });
    }

    // Individual Delete item logic
    document.getElementById('menu-delete-session')?.addEventListener('click', async () => {
        if (!activeMenuSessionId) return;

        const confirmed = await window.dinkuConfirm(
            'Delete Chat?',
            'This session will be permanently removed from your history.',
            'Delete',
            true
        );

        if (confirmed) {
            const sessionsStr = localStorage.getItem('dinku_recent_sessions') || '{}';
            let sessions = JSON.parse(sessionsStr);
            delete sessions[activeMenuSessionId];
            localStorage.setItem('dinku_recent_sessions', JSON.stringify(sessions));
            localStorage.removeItem(`dinku_chat_session_${activeMenuSessionId}`);

            // If deleting current session, start new chat
            if (activeMenuSessionId === localStorage.getItem('dinku_current_session_id')) {
                window.dispatchEvent(new CustomEvent('new-chat-requested', { detail: { skipConfirm: true } }));
            } else {
                renderRecentList(sessions);
            }
        }
        sessionMenu.classList.remove('active');
    });

    // Close menu on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.session-options-btn') && !e.target.closest('.session-menu')) {
            sessionMenu.classList.remove('active');
        }
    });

    // Clear All Sessions
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async (e) => {
            e.stopPropagation();

            const confirmed = await window.dinkuConfirm(
                'Clear All History?',
                'This will delete all your recent conversations. This action is permanent.',
                'Clear All',
                true
            );

            if (confirmed) {
                // Get all session IDs
                const sessionsStr = localStorage.getItem('dinku_recent_sessions') || '{}';
                const sessions = JSON.parse(sessionsStr);

                // Remove individual session data
                Object.keys(sessions).forEach(id => {
                    localStorage.removeItem(`dinku_chat_session_${id}`);
                });

                // Reset metadata
                localStorage.setItem('dinku_recent_sessions', '{}');
                localStorage.removeItem('dinku_current_session_id');

                // Start a fresh state
                window.location.reload();
            }
        });
    }

    // Initial load from localStorage
    const savedSessions = localStorage.getItem('dinku_recent_sessions');
    if (savedSessions) {
        try { renderRecentList(JSON.parse(savedSessions)); } catch (e) { }
    }

    // Listen for updates from chat.js
    window.addEventListener('recent-sessions-updated', (e) => {
        renderRecentList(e.detail);
    });
}

// Auto-load if this script is included as a module
loadSidebar();
