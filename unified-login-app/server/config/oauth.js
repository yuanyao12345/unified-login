/**
 * OAuth 应用配置文件
 * 
 * 使用前请先在各平台注册开发者应用，填入对应的 App ID 和密钥。
 * 注册指南请参考 README_OAUTH.md
 */

module.exports = {
    // 服务器配置
    server: {
        port: 3000,
        // 部署时改为你的公网域名，如 https://yourdomain.com
        baseUrl: 'http://localhost:3000'
    },

    // QQ 互联配置
    // 注册地址：https://connect.qq.com
    qq: {
        appId: '1112503762',
        appKey: 'iUgMjhdOYRXZpZlV',
        callbackUrl: 'http://127.0.0.1:3000/auth/qq/callback',
        // QQ互联API地址
        authorizeUrl: 'https://graph.qq.com/oauth2.0/authorize',
        accessTokenUrl: 'https://graph.qq.com/oauth2.0/token',
        userInfoUrl: 'https://graph.qq.com/user/get_user_info',
        openIdUrl: 'https://graph.qq.com/oauth2.0/me'
    },

    // 飞书配置
    // 注册地址：https://open.feishu.cn
    feishu: {
        appId: 'cli_a9564a54efb85bce',
        appSecret: 'OlM0H25YyX9kicwk0lSC9fOL1m86lw5S',
        callbackUrl: 'http://127.0.0.1:3000/auth/feishu/callback',
        authorizeUrl: 'https://open.feishu.cn/open-apis/authen/v1/authorize',
        accessTokenUrl: 'https://open.feishu.cn/open-apis/authen/v1/oidc/access_token',
        userInfoUrl: 'https://open.feishu.cn/open-apis/authen/v1/user_info'
    },

    // 钉钉配置
    // 注册地址：https://open-dev.dingtalk.com
    dingtalk: {
        appId: 'e863573f-dda8-4d8b-871e-f6b1af74972c',
        appSecret: '4gkXuTLLWoYmQuksEDLGK8TITr0hYqGFTJgA7rMFiVaLQRsY-l6_GTIiEqGVBwK8',
        callbackUrl: 'http://127.0.0.1:3000/auth/dingtalk/callback',
        authorizeUrl: 'https://login.dingtalk.com/oauth2/auth',
        accessTokenUrl: 'https://api.dingtalk.com/v1.0/oauth2/userAccessToken',
        userInfoUrl: 'https://api.dingtalk.com/v1.0/contact/users/me'
    },

    // Session 密钥（生产环境请使用随机字符串）
    sessionSecret: 'unified-login-hub-session-secret-change-in-production'
};
