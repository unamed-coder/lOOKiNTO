// ==UserScript==
// @name         lOOKiNTO
// @namespace    http://tampermonkey.net/
// @version      2026-07-20
// @description  idk
// @author       unamed-coder
// @match        https://www.luogu.com.cn/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    const Util = {
        buildUrl(baseUrl, params) {
            const url = new URL(baseUrl);
            Object.entries(params).forEach(([key, value]) => {
                if (value != null) {
                    url.searchParams.set(key, value);
                }
            });
            return url.toString();
        }
    };

    const Literal = {
        API_BASE_URL: {
            SUBMIT_RECORDS: "https://www.luogu.com.cn/record/list"
        },
        STATUS: {
            ALL: null,
            COMPILE_ERROR: 2,
            ACCEPTED: 12,
            UNACCEPTED: 14
        }
    };

    const Logging = {
        warn(content) {
            console.warn(content);
        }
    };

    const DataCollector = {
        async getSubmitRecords(user = null, problemId = null, status = null, page = 1, language = null, orderBy = 0) {
            if (user == null && problemId === null && status === null) {
                Logging.warn("providing no params means fetching the current user's submit records");
            }

            const url = Util.buildUrl(Literal.API_BASE_URL.SUBMIT_RECORDS, {
                user: user,
                problemId: problemId,
                status: status,
                page: 1,
                _contentOnly: 1
            });
            try {
                const resp = await fetch(url);
                if (!resp.ok) {
                    throw new Error(`fail to fetch submit records: HTTP code returns ${resp.status} ${resp.statusText}`);
                    return {};
                }
                const rawContent = await resp.json();
                if (rawContent.code !== 200) {
                    throw new Error(`fail to fetch submit records: JSON status code returns ${rawContent.code}`);
                }
                return rawContent;
            }
            catch (err) {
                throw new Error(`fail to fetch submit records: ${err}: `);
            }
            return {};
        }
    };

    const Panel = {
        applyStyle() {
            GM_addStyle(`
                #lookinto-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 99999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            
                #lookinto-panel {
                    width: 80%;
                    height: 100vh;
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-sizing: border-box;
                }
                
                #lookinto-panel-title {
                    font-size: 18px;
                    font-weight: bold;
                    color: #333;
                }
                
                #lookinto-panel-btn {
                    background: #1677ff;
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                }
            `);
        },
        createPanel() {
            const overlay = document.createElement('div');
            const panel = document.createElement('div');
            overlay.id = 'lookinto-overlay';
            panel.id = 'lookinto-panel';

            panel.innerHTML = `
            unimplemented
            <button id="close-panel">close</button>
            `;

            panel.querySelector('#close-panel').addEventListener('click', () => {
                overlay.remove();
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });

            overlay.appendChild(panel);
            document.body.appendChild(overlay);
        },
        setupKeyBinding() {
            document.addEventListener('keydown', (e) => {
                if (e.shiftKey && e.key === 'P') {
                    e.preventDefault();
                    if (!document.getElementById('lookinto-overlay')) {
                        this.createPanel();
                    }
                }
            });
        }
    };
})();