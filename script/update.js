// --- 1. MQTT 配置 ---
const MQTT_CONFIG = { 
    host: "broker.emqx.io", 
    port: 8084, 
    topic: "ncku/project/#" 
};

// --- 2. 初始化 MQTT Client ---
const clientId = "seat_viewer_" + Math.random().toString(16).substr(2, 8);
const client = new Paho.MQTT.Client(`wss://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}/mqtt`, clientId);

// --- 3. 擴展座位資料結構：新增一個 tagsInArea 來記錄哪些 Tag 在裡面 ---
// 我們在連線成功後初始化這個結構
function initSeatTracking() {
    Object.values(seats).forEach(seat => {
        if (!seat.tagsInArea) {
            seat.tagsInArea = new Set(); // 儲存目前在區域內的 Tag ID (例如: "tag01")
        }
    });
}

client.onMessageArrived = (msg) => {
    try {
        const data = JSON.parse(msg.payloadString);
        // 確保資料包含 id, x, y (例如 {"id":"tag01", "x":1.2, "y":3.1})
        if (typeof seats !== 'undefined' && data.id && data.x !== undefined && data.y !== undefined) {
            updateSeatsByTag(data.id, data.x, data.y);
        }
    } catch (e) {
        console.error("MQTT Failed", e);
    }
};

/**
 * 核心邏輯：支援多 Tag 獨立判定
 */
function updateSeatsByTag(tagId, x, y) {
    Object.values(seats).forEach(seat => {
        if (!seat.tagsInArea) seat.tagsInArea = new Set();

        const inside = isInside(x, y, seat.area);

        if (inside) {
            seat.tagsInArea.add(tagId);
        } else {
            // 注意：只有當這個特定的 tag 之前在裡面，現在出來了，才移除
            seat.tagsInArea.delete(tagId);
        }

        // --- 重新修正判定邏輯 ---
        if (seat.tagsInArea.size > 0) {
            // 只要區域內有人，inCnt 就累加
            seat.inCnt++;
            seat.outCnt = 0;
        } else {
            // 區域內完全沒人，outCnt 就累加
            seat.outCnt++;
            // 當完全沒人時，inCnt 應該緩慢減少或歸零，防止「湊次數」現象
            if (seat.outCnt > 5) seat.inCnt = 0; 
        }

        // 判定佔用 (THRESHOLD 設為 10)
        if (seat.inCnt >= 10 && !seat.occupied) {
            seat.occupied = true;
            seat.startTime = Date.now();
        } 
        
        // 判定釋放 (連續 10 次沒人才釋放)
        if (seat.outCnt >= 10 && seat.occupied) {
            seat.occupied = false;
            seat.startTime = null;
        }
    });

    updateSeatsUI();
}

// MQTT 連線與自動重連邏輯... (保持不變)
function connectMqtt() {
    client.connect({
        onSuccess: () => {
            console.log("MQTT Connected!");
            initSeatTracking(); // 初始化追蹤結構
            client.subscribe(MQTT_CONFIG.topic);
        },
        useSSL: true,
        onFailure: () => setTimeout(connectMqtt, 5000)
    });
}
connectMqtt();

// 每秒刷新時間顯示
setInterval(() => { if (typeof updateSeatsUI === 'function') updateSeatsUI(); }, 1000);