/**
 * OAuth 后端服务器
 * 处理 QQ、飞书、钉钉的 OAuth 授权回调
 */
const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const path = require('path');
const config = require('./config/oauth');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'www')));

// ========== 工具函数 ==========

// 生成随机 state 防 CSRF
function generateState() {
    return Math.random().toString(36).substring(2, 15);
}

// 简易内存 session 存储（生产环境请用 Redis 或数据库）
const sessions = new Map();

// ========== QQ 互联 OAuth ==========

// 跳转到 QQ 授权页
app.get('/auth/qq', (req, res) => {
    if (config.qq.appId === 'YOUR_QQ_APP_ID') {
        return res.json({ error: '请先在 server/config/oauth.js 中配置 QQ App ID' });
    }
    const state = generateState();
    sessions.set(state, { platform: 'qq', timestamp: Date.now() });
    const params = querystring.stringify({
        response_type: 'code',
        client_id: config.qq.appId,
        redirect_uri: config.qq.callbackUrl,
        state: state,
        scope: 'get_user_info'
    });
    res.redirect(`${config.qq.authorizeUrl}?${params}`);
});

// QQ 回调
app.get('/auth/qq/callback', async (req, res) => {
    const { code, state } = req.query;
    if (!code) return res.redirect('/?error=no_code');

    try {
        // 1. 用 code 换 access_token
        const tokenRes = await axios.get(config.qq.accessTokenUrl, {
            params: {
                grant_type: 'authorization_code',
                client_id: config.qq.appId,
                client_secret: config.qq.appKey,
                code: code,
                redirect_uri: config.qq.callbackUrl
            }
        });
        const { access_token } = tokenRes.data;

        // 2. 获取 OpenID
        const openIdRes = await axios.get(config.qq.openIdUrl, {
            params: { access_token }
        });
        const openid = openIdRes.data.openid;

        // 3. 获取用户信息
        const userRes = await axios.get(config.qq.userInfoUrl, {
            params: {
                access_token,
                openid,
                oauth_consumer_key: config.qq.appId
            }
        });
        const userInfo = userRes.data;

        // 4. 生成 session
        const sessionId = generateState();
        sessions.set(sessionId, {
            platform: 'qq',
            user: {
                id: openid,
                nickname: userInfo.nickname || 'QQ用户',
                avatar: userInfo.figureurl_qq_2 || userInfo.figureurl_qq_1 || '',
                platform: 'qq'
            },
            loginTime: Date.now()
        });

        // 5. 重定向回前端，携带 session
        res.redirect(`/?login=success&platform=qq&session=${sessionId}&nickname=${encodeURIComponent(userInfo.nickname || 'QQ用户')}&avatar=${encodeURIComponent(userInfo.figureurl_qq_2 || '')}`);

    } catch (err) {
        console.error('QQ OAuth error:', err.message);
        res.redirect(`/?login=error&platform=qq&message=${encodeURIComponent(err.message)}`);
    }
});

// ========== 飞书 OAuth ==========

app.get('/auth/feishu', (req, res) => {
    if (config.feishu.appId === 'YOUR_FEISHU_APP_ID') {
        return res.json({ error: '请先在 server/config/oauth.js 中配置飞书 App ID' });
    }
    const state = generateState();
    sessions.set(state, { platform: 'feishu', timestamp: Date.now() });
    const params = querystring.stringify({
        app_id: config.feishu.appId,
        redirect_uri: config.feishu.callbackUrl,
        state: state
    });
    res.redirect(`${config.feishu.authorizeUrl}?${params}`);
});


app.get('/auth/feishu/callback', async (req, res) => {
    const { code, state } = req.query;
    if (!code) return res.redirect('/?error=no_code');

    try {
        // 飞书OAuth流程：1.先获取app_access_token
        const appTokenRes = await axios.post('https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal', {
            app_id: config.feishu.appId,
            app_secret: config.feishu.appSecret
        });
        
        if (!appTokenRes.data?.app_access_token) {
            console.error('飞书 app_access_token 获取失败:', appTokenRes.data);
            return res.redirect(`/?login=error&platform=feishu&message=${encodeURIComponent('App token获取失败')}`);
        }
        const app_access_token = appTokenRes.data.app_access_token;

        // 2. 用 app_access_token + code 换取 user_access_token
        const tokenRes = await axios.post('https://open.feishu.cn/open-apis/authen/v1/oidc/access_token', {
            grant_type: 'authorization_code',
            code: code
        }, {
            headers: {
                'Authorization': `Bearer ${app_access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!tokenRes.data?.data?.access_token) {
            console.error('飞书 token 获取失败:', tokenRes.data);
            return res.redirect(`/?login=error&platform=feishu&message=${encodeURIComponent('Token获取失败: ' + (tokenRes.data?.msg || ''))}`);
        }
        const access_token = tokenRes.data.data.access_token;

        // 3. 获取用户信息
        const userRes = await axios.get('https://open.feishu.cn/open-apis/authen/v1/user_info', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const userData = userRes.data.data;

        // 4. 生成 session
        const sessionId = generateState();
        sessions.set(sessionId, {
            platform: 'feishu',
            user: {
                id: userData.sub || userData.open_id,
                nickname: userData.name || '飞书用户',
                avatar: userData.avatar_url || '',
                platform: 'feishu'
            },
            loginTime: Date.now()
        });

        res.redirect(`/?login=success&platform=feishu&session=${sessionId}&nickname=${encodeURIComponent(userData.name || '飞书用户')}`);

    } catch (err) {
        console.error('飞书 OAuth error:', err.response?.data || err.message);
        res.redirect(`/?login=error&platform=feishu&message=${encodeURIComponent(err.response?.data?.msg || err.message)}`);
    }
});

// ========== 钉钉 OAuth ==========

app.get('/auth/dingtalk', (req, res) => {
    if (config.dingtalk.appId === 'YOUR_DINGTALK_APP_KEY') {
        return res.json({ error: '请先在 server/config/oauth.js 中配置钉钉 App Key' });
    }
    const state = generateState();
    sessions.set(state, { platform: 'dingtalk', timestamp: Date.now() });
    const params = querystring.stringify({
        client_id: config.dingtalk.appId,
        redirect_uri: config.dingtalk.callbackUrl,
        response_type: 'code',
        scope: 'openid',
        state: state,
        prompt: 'consent'
    });
    res.redirect(`${config.dingtalk.authorizeUrl}?${params}`);
});

app.get('/auth/dingtalk/callback', async (req, res) => {
    const { code, state } = req.query;
    if (!code) return res.redirect('/?error=no_code');

    try {
        // 1. 用 code 换 access_token
        const tokenRes = await axios.post(config.dingtalk.accessTokenUrl, {
            clientId: config.dingtalk.appId,
            clientSecret: config.dingtalk.appSecret,
            code: code,
            grantType: 'authorization_code'
        });
        const { accessToken } = tokenRes.data.result;

        // 2. 获取用户信息
        const userRes = await axios.get(config.dingtalk.userInfoUrl, {
            headers: { 'x-acs-dingtalk-access-token': accessToken }
        });
        const userData = userRes.data;

        // 3. 生成 session
        const sessionId = generateState();
        sessions.set(sessionId, {
            platform: 'dingtalk',
            user: {
                id: userData.unionId || userData.userId,
                nickname: userData.nick || '钉钉用户',
                avatar: userData.avatarUrl || '',
                platform: 'dingtalk'
            },
            loginTime: Date.now()
        });

        res.redirect(`/?login=success&platform=dingtalk&session=${sessionId}&nickname=${encodeURIComponent(userData.nick || '钉钉用户')}&avatar=${encodeURIComponent(userData.avatarUrl || '')}`);

    } catch (err) {
        console.error('钉钉 OAuth error:', err.message);
        res.redirect(`/?login=error&platform=dingtalk&message=${encodeURIComponent(err.message)}`);
    }
});

// ========== API 接口 ==========

// 获取登录用户信息
app.get('/api/user/:sessionId', (req, res) => {
    const session = sessions.get(req.params.sessionId);
    if (!session) {
        return res.status(401).json({ error: '会话已过期，请重新登录' });
    }
    res.json({ user: session.user });
});

// 登出
app.post('/api/logout/:sessionId', (req, res) => {
    sessions.delete(req.params.sessionId);
    res.json({ success: true });
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// ========== 启动服务器 ==========
const PORT = config.server.port;
app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   统一登录中心 - OAuth 后端服务已启动    ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║   本地访问: http://localhost:${PORT}          ║`);
    console.log('║                                          ║');
    console.log('║   OAuth 回调地址:                        ║');
    console.log(`║   QQ:     ${config.qq.callbackUrl.padEnd(29)}║`);
    console.log(`║   飞书:   ${config.feishu.callbackUrl.padEnd(29)}║`);
    console.log(`║   钉钉:   ${config.dingtalk.callbackUrl.padEnd(29)}║`);
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
});
