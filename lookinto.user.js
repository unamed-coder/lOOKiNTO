// ==UserScript==
// @name         lOOKiNTO
// @namespace    http://github.com/unamed-coder/lOOKiNTO
// @version      2026-07-20
// @description  idk
// @author       unamed-coder
// @match        https://www.luogu.com.cn/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// @downloadURL https://raw.githubusercontent.com/unamed-coder/lOOKiNTO/main/lookinto.user.js
// @updateURL https://raw.githubusercontent.com/unamed-coder/lOOKiNTO/main/lookinto.user.js
// ==/UserScript==

(async function () {
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
        },
        secTimestampToDate(timestamp) {
            const date = new Date(timestamp * 1000);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        secTimestampToTime(secTimestamp) {
            const date = new Date(secTimestamp * 1000);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        },
        buildRecordDetailsUrl(recordId) {
            return `${Literal.API_BASE_URL.RECORD_DETAILS}${recordId}`;
        }
    };

    const Literal = {
        API_BASE_URL: {
            SUBMIT_RECORDS: "https://www.luogu.com.cn/record/list",
            RECORD_DETAILS: "https://www.luogu.com.cn/record/"
        },
        STATUS: {
            ALL: null,
            COMPILE_ERROR: 2,
            ACCEPTED: 12,
            UNACCEPTED: 14
        },
        SELECTOR: {
            SIDEBAR_CARD_LAST: 'div.l-card:last-child',
            SIDEBAR_CARD_CONTAINTER: '.side'
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
        }
    };

    const Renderer = {
        sidebarCard: {
            getContainer() {
                const containter = document.querySelector(Literal.SELECTOR.SIDEBAR_CARD_CONTAINTER);
                if (!containter) {
                    throw new Error('fail to query sidebar card container element');
                }
                return containter;
            },

            create(header) {
                const srcCard = document.querySelector(Literal.SELECTOR.SIDEBAR_CARD_LAST);
                if (!srcCard) {
                    throw new Error('fail to query sidebar card element');
                }

                const cloneCard = document.createElement(srcCard.tagName);
                for (const attr of srcCard.attributes) {
                    cloneCard.setAttribute(attr.name, attr.value);
                }
                const cardHeader = document.createElement('h3');
                cardHeader.className = 'lfe-h3';
                cardHeader.textContent = header;
                cloneCard.appendChild(cardHeader);

                return cloneCard;
            },

            createInfoRow(sidebarCard, name, value, link = null) {
                const infoRow = document.createElement('div');
                infoRow.className = 'l-flex-info-row';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = name;
                const valueDiv = document.createElement('div');
                valueDiv.className = 'right';
                if (link) {
                    const linkA = document.createElement('a');
                    linkA.textContent = value;
                    linkA.href = link;
                    linkA.target = '_blank';
                    linkA.rel = 'noopener noreferrer'
                    valueDiv.appendChild(linkA);
                }
                else {
                    valueDiv.textContent = value;
                }
                infoRow.append(nameSpan, valueDiv);

                return infoRow;
            }
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

    async function main() {
        const userHomepagePattern = /^https:\/\/www\.luogu\.com\.cn\/user\/(\d+)$/;
        const matchResult = window.location.href.match(userHomepagePattern);
        if (matchResult) {
            console.log('Matched! now working... ...')
            const userId = matchResult[1];
            const submitRecords = await DataCollector.getSubmitRecords(userId);
            const lastSubmitTimestamp = submitRecords.currentData.records.result[0].submitTime;
            console.log(lastSubmitTimestamp);
            const recordId = submitRecords.currentData.records.result[0].id;
            const dateStr = Util.secTimestampToDate(lastSubmitTimestamp);
            const timeStr = Util.secTimestampToTime(lastSubmitTimestamp);

            const container = Renderer.sidebarCard.getContainer();
            const newCard = Renderer.sidebarCard.create('最后一次提交题目');
            const infoRow1 = Renderer.sidebarCard.createInfoRow(newCard, '日期', dateStr);
            const infoRow2 = Renderer.sidebarCard.createInfoRow(newCard, '时间', timeStr);
            const infoRow3 = Renderer.sidebarCard.createInfoRow(newCard, '提交详情', recordId, Util.buildRecordDetailsUrl(recordId));

            newCard.append(infoRow1, infoRow2, infoRow3);
            container.appendChild(newCard);

            console.log('Injected!');
        }
    }

    main();
})();