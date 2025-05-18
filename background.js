chrome.runtime.onInstalled.addListener(function(details) {
    console.log("Background: onInstalled event. Reason:", details.reason);
    if (details.reason === "install") {
        chrome.storage.local.set({isEnabled: true}, function() {
            if (chrome.runtime.lastError) {
                console.error("Background: Error setting initial isEnabled to true on install:", chrome.runtime.lastError.message);
            } else {
                console.log("Background: Plain Text Copy extension installed. Defaulting to enabled in storage.");
            }
        });
    } else if (details.reason === "update") {
        chrome.storage.local.get(['isEnabled'], function(result) {
            console.log("Background: Update detected. Current isEnabled in storage:", result.isEnabled);
            if (result.isEnabled === undefined) {
                chrome.storage.local.set({isEnabled: true}, function() {
                    if (chrome.runtime.lastError) {
                        console.error("Background: Error setting isEnabled to true on update (was undefined):", chrome.runtime.lastError.message);
                    } else {
                        console.log("Background: isEnabled was undefined on update, set to true in storage.");
                    }
                });
            }
        });
    }
});

// 可選：監聽瀏覽器啟動，確保狀態
chrome.runtime.onStartup.addListener(function() {
    console.log("Background: Browser startup.");
    // 這裡也可以檢查 isEnabled 是否存在，如果不存在則設定預設值
    // 這有助於處理某些 edge cases，但通常 onInstalled 應該足夠
    chrome.storage.local.get(['isEnabled'], function(result) {
        if (result.isEnabled === undefined) {
            console.log("Background: onStartup - isEnabled is undefined. Setting to true.");
            chrome.storage.local.set({isEnabled: true});
        }
    });
});