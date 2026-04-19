/**
 * 统一登录中心 - 主应用逻辑
 * 功能：多平台登录、凭证管理、消息聚合、跨平台转发
 */

// ===== 平台配置 =====
const PLATFORMS = {
    wechat: {
        name: '微信',
        color: '#07C160',
        bgColor: 'rgba(7,193,96,0.1)',
        icon: '💬',
        sampleAccount: 'wx_user_2024'
    },
    qq: {
        name: 'QQ',
        color: '#12B7F5',
        bgColor: 'rgba(18,183,245,0.1)',
        icon: '🐧',
        sampleAccount: 'qq_123456789'
    },
    feishu: {
        name: '飞书',
        color: '#3370FF',
        bgColor: 'rgba(51,112,255,0.1)',
        icon: '🐦',
        sampleAccount: 'feishu_zhangsan'
    },
    dingtalk: {
        name: '钉钉',
        color: '#3296FA',
        bgColor: 'rgba(50,150,250,0.1)',
        icon: '📌',
        sampleAccount: 'ding_lisi'
    }
};

// ===== 模拟消息数据 =====
const SAMPLE_MESSAGES = {
    wechat: [
        {
            id: 'w1',
            contact: '张三',
            avatar: '张',
            avatarColor: '#07C160',
            messages: [
                { text: '明天下午3点开会，记得准备一下项目进度报告', time: '14:30', sent: false },
                { text: '好的，我整理一下', time: '14:32', sent: true },
                { text: '另外把上周的数据分析也带上', time: '14:35', sent: false },
                { text: '收到，我会提前准备好的', time: '14:36', sent: true },
            ],
            unread: 2,
            lastTime: '14:35'
        },
        {
            id: 'w2',
            contact: '产品讨论群',
            avatar: '产',
            avatarColor: '#F59E0B',
            messages: [
                { text: '新版设计稿已经上传到共享文件夹了', time: '11:20', sent: false },
                { text: '大家看看有没有需要修改的地方', time: '11:21', sent: false },
            ],
            unread: 5,
            lastTime: '11:21'
        },
        {
            id: 'w3',
            contact: '李经理',
            avatar: '李',
            avatarColor: '#8B5CF6',
            messages: [
                { text: 'Q3的预算方案审批通过了吗？', time: '昨天', sent: true },
                { text: '已经通过了，财务那边说下周拨款', time: '昨天', sent: false },
            ],
            unread: 0,
            lastTime: '昨天'
        }
    ],
    qq: [
        {
            id: 'q1',
            contact: '技术交流群',
            avatar: '技',
            avatarColor: '#12B7F5',
            messages: [
                { text: '有人用过React 19的新特性吗？', time: '15:10', sent: false },
                { text: 'Server Components确实好用', time: '15:12', sent: false },
                { text: '我最近在项目里试了一下，性能提升很明显', time: '15:15', sent: true },
            ],
            unread: 12,
            lastTime: '15:15'
        },
        {
            id: 'q2',
            contact: '小王',
            avatar: '王',
            avatarColor: '#EC4899',
            messages: [
                { text: '周末一起打球吗？', time: '10:00', sent: false },
                { text: '可以啊，老地方？', time: '10:05', sent: true },
            ],
            unread: 1,
            lastTime: '10:00'
        }
    ],
    feishu: [
        {
            id: 'f1',
            contact: '项目协作空间',
            avatar: '协',
            avatarColor: '#3370FF',
            messages: [
                { text: '【文档共享】Q4产品路线图已更新，请各位查阅', time: '16:00', sent: false },
                { text: '飞书文档链接已同步到项目群', time: '16:02', sent: false },
                { text: '收到，我看完后给反馈', time: '16:10', sent: true },
            ],
            unread: 3,
            lastTime: '16:02'
        },
        {
            id: 'f2',
            contact: 'HR通知',
            avatar: 'HR',
            avatarColor: '#EF4444',
            messages: [
                { text: '【重要通知】下周五团建活动安排：上午户外拓展，下午自由活动', time: '09:00', sent: false },
                { text: '请在本周三之前确认参加', time: '09:01', sent: false },
            ],
            unread: 1,
            lastTime: '09:01'
        }
    ],
    dingtalk: [
        {
            id: 'd1',
            contact: '全员公告',
            avatar: '公',
            avatarColor: '#3296FA',
            messages: [
                { text: '【系统升级通知】本周六凌晨2:00-6:00进行系统维护，届时OA系统将暂停服务', time: '08:00', sent: false },
            ],
            unread: 1,
            lastTime: '08:00'
        },
        {
            id: 'd2',
            contact: '审批通知',
            avatar: '审',
            avatarColor: '#F97316',
            messages: [
                { text: '您有一条新的报销审批待处理，金额：¥2,580.00', time: '13:30', sent: false },
                { text: '出差申请已通过审批', time: '12:00', sent: false },
            ],
            unread: 2,
            lastTime: '13:30'
        }
    ]
};

// ===== 应用状态 =====
let currentPlatform = null;    // 当前正在登录的平台
let currentChat = null;        // 当前打开的聊天
let currentTab = 'all';        // 当前消息标签
let forwardData = null;        // 转发数据
let selectedForwardPlatform = null;  // 转发目标平台
let selectedForwardContact = null;   // 转发目标联系人
let screenHistory = [];        // 屏幕历史

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    // 显示启动页
    setTimeout(() => {
        switchScreen('login-screen');
        updateLoginStatus();
    }, 2000);
});

// ===== 屏幕切换 =====
function switchScreen(screenId, addToHistory = true) {
    const currentActive = document.querySelector('.screen.active');
    if (currentActive && addToHistory) {
        screenHistory.push(currentActive.id);
    }

    if (currentActive) {
        currentActive.classList.remove('active');
        currentActive.classList.add('slide-left');
        setTimeout(() => currentActive.classList.remove('slide-left'), 350);
    }

    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
    }
}

function goBack() {
    if (screenHistory.length > 0) {
        const prevScreen = screenHistory.pop();
        const currentActive = document.querySelector('.screen.active');
        if (currentActive) {
            currentActive.classList.remove('active');
        }
        const target = document.getElementById(prevScreen);
        if (target) {
            target.classList.add('active');
        }
    }
}

// ===== OAuth 真实登录配置 =====
const OAUTH_MODE = true; // true=真实OAuth登录, false=模拟登录
const API_BASE = 'http://localhost:3000'; // 后端服务地址，部署时改为实际域名

// ===== 登录功能 =====
function startLogin(platform) {
    currentPlatform = platform;
    const config = PLATFORMS[platform];

    // 微信暂不支持（需要企业资质），使用模拟登录
    if (platform === 'wechat' || !OAUTH_MODE) {
        showMockLogin(platform, config);
        return;
    }

    // 真实 OAuth 登录
    const credentials = getCredentials(platform);
    if (credentials) {
        switchScreen('main-screen');
        renderMessageList();
        return;
    }

    // 跳转到后端 OAuth 授权页
    showToast(`正在跳转到${config.name}授权页...`);
    setTimeout(() => {
        window.location.href = `${API_BASE}/auth/${platform}`;
    }, 500);
}

// 模拟登录（弹窗表单）
function showMockLogin(platform, config) {
    const credentials = getCredentials(platform);
    if (credentials) {
        switchScreen('main-screen');
        renderMessageList();
        return;
    }

    // 设置弹窗内容
    document.getElementById('modal-platform-name').textContent = `登录${config.name}`;
    document.getElementById('modal-platform-icon').innerHTML = `
        <div style="width:56px;height:56px;border-radius:14px;background:${config.bgColor};
            display:flex;align-items:center;justify-content:center;font-size:28px;">
            ${config.icon}
        </div>
    `;

    // 清空表单
    document.getElementById('login-account').value = '';
    document.getElementById('login-password').value = '';

    // 显示弹窗
    document.getElementById('login-modal').classList.add('show');
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.remove('show');
    currentPlatform = null;
}

function togglePassword() {
    const input = document.getElementById('login-password');
    const icon = document.getElementById('eye-icon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        `;
    } else {
        input.type = 'password';
        icon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        `;
    }
}

function performLogin() {
    const account = document.getElementById('login-account').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const remember = document.getElementById('remember-login').checked;

    if (!account) {
        showToast('请输入账号或手机号');
        return;
    }
    if (!password) {
        showToast('请输入密码');
        return;
    }

    // 显示加载状态
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';

    // 模拟登录过程
    setTimeout(() => {
        // 保存凭证
        const loggedInPlatform = currentPlatform;
        const platformName = PLATFORMS[currentPlatform].name;
        saveCredentials(loggedInPlatform, account, password, remember);

        // 恢复按钮状态
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';

        // 关闭弹窗
        closeLoginModal();

        // 更新状态
        updateLoginStatus();
        showToast(`${platformName}登录成功！`);

        // 检查是否所有平台都已登录
        checkAllLoggedIn();
    }, 1500);
}

function simulateQRLogin() {
    const account = PLATFORMS[currentPlatform].sampleAccount;
    document.getElementById('login-account').value = account;
    document.getElementById('login-password').value = 'demo123456';
    showToast('扫码成功，正在自动填充...');
    setTimeout(() => performLogin(), 800);
}

function simulateSMSLogin() {
    const account = PLATFORMS[currentPlatform].sampleAccount;
    document.getElementById('login-account').value = account;
    document.getElementById('login-password').value = '123456';
    showToast('验证码已发送，自动填充验证码: 123456');
    setTimeout(() => performLogin(), 800);
}

// ===== 凭证存储模块 =====
const CREDENTIAL_PREFIX = 'ulh_cred_';
const CREDENTIAL_DAYS = 30;

function saveCredentials(platform, account, password, remember) {
    const data = {
        platform,
        account,
        password: btoa(unescape(encodeURIComponent(password))), // Base64 编码（支持中文）
        loginTime: Date.now(),
        remember,
        expireTime: remember ? Date.now() + CREDENTIAL_DAYS * 24 * 60 * 60 * 1000 : 0
    };
    localStorage.setItem(CREDENTIAL_PREFIX + platform, JSON.stringify(data));
}

function getCredentials(platform) {
    const raw = localStorage.getItem(CREDENTIAL_PREFIX + platform);
    if (!raw) return null;

    try {
        const data = JSON.parse(raw);

        // 检查是否过期
        if (data.remember && data.expireTime && Date.now() > data.expireTime) {
            localStorage.removeItem(CREDENTIAL_PREFIX + platform);
            return null;
        }

        // 如果不记住登录，关闭后即失效
        if (!data.remember) {
            localStorage.removeItem(CREDENTIAL_PREFIX + platform);
            return null;
        }

        return data;
    } catch (e) {
        return null;
    }
}

function removeCredentials(platform) {
    localStorage.removeItem(CREDENTIAL_PREFIX + platform);
}

function getAllCredentials() {
    const result = {};
    Object.keys(PLATFORMS).forEach(p => {
        result[p] = getCredentials(p);
    });
    return result;
}

function getRemainingDays(platform) {
    const cred = getCredentials(platform);
    if (!cred || !cred.expireTime) return 0;
    const remaining = cred.expireTime - Date.now();
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

function updateLoginStatus() {
    const credentials = getAllCredentials();

    Object.keys(PLATFORMS).forEach(platform => {
        const card = document.querySelector(`.platform-card[data-platform="${platform}"]`);
        if (!card) return;

        const info = card.querySelector('.platform-info p');
        const status = card.querySelector('.platform-status');

        if (credentials[platform]) {
            info.textContent = credentials[platform].account;
            info.classList.add('logged-in');
            status.classList.remove('not-logged');
            status.classList.add('logged');
        } else {
            info.textContent = '未登录';
            info.classList.remove('logged-in');
            status.classList.remove('logged');
            status.classList.add('not-logged');
        }
    });

    // 显示/隐藏"进入消息中心"按钮
    const hasAnyLogin = Object.values(credentials).some(c => c !== null);
    const enterBtn = document.getElementById('btn-enter-main');
    if (enterBtn) {
        enterBtn.style.display = hasAnyLogin ? 'flex' : 'none';
    }
}

function checkAllLoggedIn() {
    const credentials = getAllCredentials();
    const allLoggedIn = Object.values(credentials).every(c => c !== null);
    if (allLoggedIn) {
        setTimeout(() => {
            showToast('所有平台已登录，进入消息中心');
            setTimeout(() => {
                switchScreen('main-screen');
                renderMessageList();
            }, 500);
        }, 800);
    }
}

function enterMainScreen() {
    switchScreen('main-screen');
    renderMessageList();
}

// ===== 消息列表 =====
function renderMessageList() {
    const list = document.getElementById('message-list');
    const credentials = getAllCredentials();
    let messages = [];

    Object.keys(SAMPLE_MESSAGES).forEach(platform => {
        if (currentTab !== 'all' && currentTab !== platform) return;
        if (!credentials[platform]) return;

        SAMPLE_MESSAGES[platform].forEach(chat => {
            messages.push({
                ...chat,
                platform,
                platformName: PLATFORMS[platform].name,
                platformColor: PLATFORMS[platform].color
            });
        });
    });

    // 按时间排序
    messages.sort((a, b) => {
        if (a.lastTime.includes(':') && b.lastTime.includes(':')) return 0;
        if (a.lastTime.includes(':')) return -1;
        return 1;
    });

    if (messages.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M40 54H22a8 8 0 0 1-8-8V22a8 8 0 0 1 8-8h16l10 10v22a8 8 0 0 1-8 8z"/>
                    <path d="M38 14v10h10"/>
                    <line x1="20" y1="30" x2="44" y2="30"/>
                    <line x1="20" y1="38" x2="38" y2="38"/>
                    <line x1="20" y1="46" x2="32" y2="46"/>
                </svg>
                <p>${currentTab === 'all' ? '暂无消息，请先登录平台' : '该平台暂无消息'}</p>
            </div>
        `;
        return;
    }

    list.innerHTML = messages.map(msg => `
        <div class="message-item" onclick="openChat('${msg.platform}', '${msg.id}')">
            <div class="message-avatar" style="background:${msg.avatarColor}">
                ${msg.avatar}
            </div>
            <div class="message-content">
                <div class="message-top">
                    <span class="message-name">
                        ${msg.contact}
                        <span class="message-platform-label ${msg.platform}">${msg.platformName}</span>
                    </span>
                    <span class="message-time">${msg.lastTime}</span>
                </div>
                <div class="message-preview">${msg.messages[msg.messages.length - 1].text}</div>
            </div>
            ${msg.unread > 0 ? `<div class="message-unread"></div>` : ''}
        </div>
    `).join('');

    updateBadges();
}

function updateBadges() {
    const credentials = getAllCredentials();
    let totalUnread = 0;

    Object.keys(SAMPLE_MESSAGES).forEach(platform => {
        if (!credentials[platform]) {
            document.getElementById(`badge-${platform}`).textContent = '';
            return;
        }
        const unread = SAMPLE_MESSAGES[platform].reduce((sum, chat) => sum + chat.unread, 0);
        totalUnread += unread;
        const badge = document.getElementById(`badge-${platform}`);
        badge.textContent = unread > 0 ? unread : '';
    });

    const allBadge = document.getElementById('badge-all');
    allBadge.textContent = totalUnread > 0 ? totalUnread : '';
}

// ===== 标签切换 =====
function switchTab(tab) {
    currentTab = tab;

    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });

    renderMessageList();
}

// ===== 聊天详情 =====
function openChat(platform, chatId) {
    const chat = SAMPLE_MESSAGES[platform].find(c => c.id === chatId);
    if (!chat) return;

    currentChat = { platform, chatId, chat };

    // 设置标题
    document.getElementById('chat-title').textContent = chat.contact;
    const tag = document.getElementById('chat-platform-tag');
    tag.textContent = PLATFORMS[platform].name;
    tag.className = `platform-tag ${platform}`;

    // 清除未读
    chat.unread = 0;

    // 渲染消息
    renderChatMessages(chat);

    switchScreen('chat-screen');
    updateBadges();
}

function renderChatMessages(chat) {
    const container = document.getElementById('chat-messages');
    container.innerHTML = chat.messages.map(msg => `
        <div class="chat-bubble ${msg.sent ? 'sent' : 'received'}">
            <div class="bubble-content">${msg.text}</div>
            <span class="bubble-time">${msg.time}</span>
            ${msg.forwardSource ? `
                <span class="bubble-forward-tag">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 3 21 3 21 9"/><line x1="21" y1="3" x2="14" y2="10"/>
                    </svg>
                    转发自 ${msg.forwardSource}
                </span>
            ` : ''}
        </div>
    `).join('');

    // 滚动到底部
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || !currentChat) return;

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    currentChat.chat.messages.push({ text, time, sent: true });
    input.value = '';
    renderChatMessages(currentChat.chat);

    // 模拟自动回复
    setTimeout(() => {
        const replies = [
            '好的，收到！',
            '我知道了，稍后处理',
            '没问题，马上安排',
            '了解，我看看',
            '谢谢提醒！',
            '好的，我确认一下'
        ];
        const reply = replies[Math.floor(Math.random() * replies.length)];
        const replyTime = new Date();
        currentChat.chat.messages.push({
            text: reply,
            time: `${replyTime.getHours().toString().padStart(2, '0')}:${replyTime.getMinutes().toString().padStart(2, '0')}`,
            sent: false
        });
        renderChatMessages(currentChat.chat);
    }, 1000 + Math.random() * 2000);
}

function handleChatKeypress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// ===== 跨平台转发功能 =====
function showForwardFromChat() {
    if (!currentChat) return;

    // 获取最后一条收到的消息
    const lastReceived = [...currentChat.chat.messages].reverse().find(m => !m.sent);
    if (!lastReceived) {
        showToast('没有可转发的消息');
        return;
    }

    forwardData = {
        text: lastReceived.text,
        sourcePlatform: currentChat.platform,
        sourcePlatformName: PLATFORMS[currentChat.platform].name,
        sourceContact: currentChat.chat.contact,
        time: lastReceived.time
    };

    selectedForwardPlatform = null;
    selectedForwardContact = null;

    renderForwardPage();
    switchScreen('forward-screen');
}

function handleCopyFromChat() {
    if (!currentChat) return;
    const lastMsg = currentChat.chat.messages[currentChat.chat.messages.length - 1];
    if (lastMsg) {
        copyToClipboard(lastMsg.text);
        showToast('已复制到剪贴板');
    }
}

function renderForwardPage() {
    if (!forwardData) return;

    // 内容预览
    document.getElementById('forward-preview').innerHTML = `
        <div class="forward-preview-label">转发内容</div>
        <div class="forward-preview-text">${forwardData.text}</div>
        <div class="forward-preview-source">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 3 21 3 21 9"/><line x1="21" y1="3" x2="14" y2="10"/>
            </svg>
            来自 ${forwardData.sourcePlatformName} - ${forwardData.sourceContact}
        </div>
    `;

    // 平台选择
    const credentials = getAllCredentials();
    const platformList = document.getElementById('forward-platform-list');
    const loggedPlatforms = Object.keys(credentials).filter(p => credentials[p] && p !== forwardData.sourcePlatform);

    if (loggedPlatforms.length === 0) {
        platformList.innerHTML = '<p style="color:var(--text-hint);font-size:13px;padding:12px;">暂无其他已登录平台</p>';
        document.getElementById('forward-contact-list').innerHTML = '';
        return;
    }

    platformList.innerHTML = loggedPlatforms.map(p => `
        <div class="forward-platform-item" onclick="selectForwardPlatform('${p}')" id="fp-${p}">
            <div class="fp-icon" style="background:${PLATFORMS[p].bgColor};color:${PLATFORMS[p].color}">
                ${PLATFORMS[p].icon}
            </div>
            <span>${PLATFORMS[p].name}</span>
        </div>
    `).join('');

    document.getElementById('forward-contact-list').innerHTML = '';
}

function selectForwardPlatform(platform) {
    selectedForwardPlatform = platform;
    selectedForwardContact = null;

    // 更新选中状态
    document.querySelectorAll('.forward-platform-item').forEach(el => {
        el.classList.toggle('selected', el.id === `fp-${platform}`);
    });

    // 渲染联系人列表
    const contacts = SAMPLE_MESSAGES[platform] || [];
    const contactList = document.getElementById('forward-contact-list');

    contactList.innerHTML = `
        <h4 style="font-size:13px;color:var(--text-hint);padding:8px 4px;font-weight:500;">选择联系人</h4>
        ${contacts.map(c => `
            <div class="forward-contact-item" onclick="selectForwardContact('${platform}', '${c.id}')" id="fc-${c.id}">
                <div class="forward-contact-avatar" style="background:${c.avatarColor}">
                    ${c.avatar}
                </div>
                <div class="forward-contact-info">
                    <div class="forward-contact-name">${c.contact}</div>
                    <div class="forward-contact-platform">${PLATFORMS[platform].name}</div>
                </div>
                <div class="forward-contact-check"></div>
            </div>
        `).join('')}
    `;
}

function selectForwardContact(platform, contactId) {
    selectedForwardContact = contactId;

    document.querySelectorAll('.forward-contact-item').forEach(el => {
        el.classList.toggle('selected', el.id === `fc-${contactId}`);
    });
}

function executeForward() {
    if (!selectedForwardPlatform) {
        showToast('请选择目标平台');
        return;
    }
    if (!selectedForwardContact) {
        showToast('请选择转发联系人');
        return;
    }

    // 执行转发 - 将消息添加到目标聊天
    const targetChat = SAMPLE_MESSAGES[selectedForwardPlatform].find(c => c.id === selectedForwardContact);
    if (!targetChat) return;

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 添加转发标记的消息
    targetChat.messages.push({
        text: forwardData.text,
        time,
        sent: false,
        forwardSource: `${forwardData.sourcePlatformName}-${forwardData.sourceContact}`
    });

    targetChat.unread += 1;
    targetChat.lastTime = time;

    // 显示成功动画
    const overlay = document.getElementById('forward-success-overlay');
    overlay.style.display = 'flex';

    setTimeout(() => {
        overlay.style.display = 'none';
        goBack();
        renderMessageList();
        showToast(`已转发到${PLATFORMS[selectedForwardPlatform].name}的${targetChat.contact}`);
    }, 1500);
}

// ===== 底部导航 =====
function switchNav(section) {
    document.querySelectorAll('.nav-item').forEach((item, index) => {
        item.classList.toggle('active', index === ['messages', 'contacts', 'forward', 'profile'].indexOf(section));
    });

    switch (section) {
        case 'messages':
            renderMessageList();
            break;
        case 'forward':
            showForwardCenter();
            break;
        case 'profile':
            showSettings();
            break;
        case 'contacts':
            showToast('通讯录功能开发中');
            break;
    }
}

function showForwardCenter() {
    // 转发中心 - 显示最近可转发的消息
    const credentials = getAllCredentials();
    let recentMessages = [];

    Object.keys(SAMPLE_MESSAGES).forEach(platform => {
        if (!credentials[platform]) return;
        SAMPLE_MESSAGES[platform].forEach(chat => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            if (lastMsg) {
                recentMessages.push({
                    text: lastMsg.text,
                    platform,
                    platformName: PLATFORMS[platform].name,
                    contact: chat.contact,
                    chatId: chat.id,
                    time: lastMsg.time
                });
            }
        });
    });

    if (recentMessages.length === 0) {
        showToast('暂无可转发的消息');
        return;
    }

    // 使用最后一条消息作为转发内容
    const latest = recentMessages[0];
    forwardData = {
        text: latest.text,
        sourcePlatform: latest.platform,
        sourcePlatformName: latest.platformName,
        sourceContact: latest.contact,
        time: latest.time
    };
    selectedForwardPlatform = null;
    selectedForwardContact = null;

    renderForwardPage();
    switchScreen('forward-screen');
}

// ===== 设置页面 =====
function showSettings() {
    const credentials = getAllCredentials();

    const accountsHtml = Object.keys(PLATFORMS).map(platform => {
        const cred = credentials[platform];
        const config = PLATFORMS[platform];

        if (cred) {
            const days = getRemainingDays(platform);
            return `
                <div class="settings-account-item">
                    <div class="settings-account-icon" style="background:${config.bgColor};color:${config.color}">
                        ${config.icon}
                    </div>
                    <div class="settings-account-info">
                        <div class="settings-account-name">${config.name}</div>
                        <div class="settings-account-id">${cred.account}</div>
                        <div class="settings-account-expire">凭证剩余 ${days} 天</div>
                    </div>
                    <button class="settings-account-logout" onclick="logoutPlatform('${platform}')">退出</button>
                </div>
            `;
        } else {
            return `
                <div class="settings-account-item" style="opacity:0.5">
                    <div class="settings-account-icon" style="background:${config.bgColor};color:${config.color}">
                        ${config.icon}
                    </div>
                    <div class="settings-account-info">
                        <div class="settings-account-name">${config.name}</div>
                        <div class="settings-account-id">未登录</div>
                    </div>
                    <button class="settings-account-logout" style="border-color:var(--primary);color:var(--primary)"
                        onclick="goBack();setTimeout(()=>startLogin('${platform}'),400)">登录</button>
                </div>
            `;
        }
    }).join('');

    document.getElementById('settings-accounts').innerHTML = accountsHtml;
    switchScreen('settings-screen');
}

function logoutPlatform(platform) {
    removeCredentials(platform);
    updateLoginStatus();
    showSettings();
    showToast(`${PLATFORMS[platform].name}已退出登录`);
}

function logoutAll() {
    Object.keys(PLATFORMS).forEach(p => removeCredentials(p));
    updateLoginStatus();
    screenHistory = [];
    switchScreen('login-screen', false);
    showToast('已退出所有账号');
}

// ===== 工具函数 =====
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

// ===== OAuth 回调处理 =====
function handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const loginStatus = params.get('login');
    const platform = params.get('platform');
    const sessionId = params.get('session');
    const nickname = params.get('nickname');
    const avatar = params.get('avatar');
    const errorMessage = params.get('message');

    if (!loginStatus || !platform) return;

    // 清除URL参数
    window.history.replaceState({}, '', '/');

    if (loginStatus === 'error') {
        showToast(`${PLATFORMS[platform]?.name || platform}登录失败: ${errorMessage || '未知错误'}`);
        return;
    }

    if (loginStatus === 'success' && sessionId) {
        // 保存OAuth登录凭证
        saveCredentials(platform, nickname || sessionId, 'oauth_token', true);
        updateLoginStatus();
        showToast(`${PLATFORMS[platform]?.name || platform}登录成功！欢迎，${decodeURIComponent(nickname || '用户')}`);

        // 检查是否所有平台都已登录
        setTimeout(() => checkAllLoggedIn(), 500);
    }
}

// 页面加载时检查OAuth回调
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        handleOAuthCallback();
    }, 100);
});
