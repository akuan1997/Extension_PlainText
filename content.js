let isExtensionEnabled = true; // 預設啟用 (會在 loadInitialState 中被 storage 的值覆蓋)
console.log('Content Script: Initializing. Default isExtensionEnabled:', isExtensionEnabled);

function loadInitialState() {
    chrome.storage.local.get(['isEnabled'], function(result) {
        console.log('Content Script: loadInitialState - storage.get callback. Raw result:', result);
        if (result.isEnabled === undefined) {
            isExtensionEnabled = true; // 預設為 true
            // 將預設值寫回 storage，確保一致性
            chrome.storage.local.set({isEnabled: true}, function() {
                if (chrome.runtime.lastError) {
                    console.error('Content Script: loadInitialState - Error setting default true to storage:', chrome.runtime.lastError.message);
                } else {
                    console.log('Content Script: loadInitialState - isEnabled was undefined, set to true in storage and locally.');
                }
            });
        } else {
            isExtensionEnabled = result.isEnabled;
            console.log('Content Script: loadInitialState - Loaded from storage. isExtensionEnabled set to:', isExtensionEnabled);
        }
    });
}

function handleCopyEvent(e) {
    // 在事件處理開始時打印當前狀態，這非常重要
    console.log('Content Script: handleCopyEvent triggered. Current isExtensionEnabled state:', isExtensionEnabled);

    if (!isExtensionEnabled) {
        console.log('Content Script: Extension is disabled. Allowing default copy behavior.');
        return; // 如果擴充功能被禁用，則不做任何事
    }

    console.log('Content Script: Extension is enabled. Processing plain text copy.');
    e.preventDefault();

    let selectedText = window.getSelection().toString();

    function cleanText(text) { // 你的 cleanText 函數保持不變
        return text
            .replace(/\s+/g, ' ')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();
    }

    const cleanedText = cleanText(selectedText);

    try {
        if (e.clipboardData && e.clipboardData.setData) {
            e.clipboardData.setData('text/plain', cleanedText);
            console.log('Content Script: Copied to clipboard using e.clipboardData.');
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(cleanedText)
                .then(() => console.log('Content Script: Copied to clipboard using navigator.clipboard.writeText.'))
                .catch(err => {
                    console.warn('Content Script: Fallback navigator.clipboard.writeText failed.', err);
                    fallbackCopyTextToClipboard(cleanedText);
                });
        } else {
            fallbackCopyTextToClipboard(cleanedText);
        }
    } catch (err) {
        console.error('Content Script: Copy failed:', err);
        fallbackCopyTextToClipboard(cleanedText);
    }
}

function fallbackCopyTextToClipboard(text) {
    // ... (你的 fallbackCopyTextToClipboard 函數) ...
    // 建議也在這裡加 log
    console.log('Content Script: Attempting fallback copy method.');
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; textArea.style.top = "0"; textArea.style.left = "0";
    textArea.style.width = "1px"; textArea.style.height = "1px"; textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus(); textArea.select();
    try {
        document.execCommand('copy');
        console.log('Content Script: Fallback: Copied to clipboard using execCommand.');
    } catch (err) {
        console.error('Content Script: Fallback: execCommand copy failed', err);
    }
    document.body.removeChild(textArea);
}

// ---- 主要邏輯 ----
loadInitialState();

chrome.storage.onChanged.addListener(function(changes, namespace) {
    console.log('Content Script: storage.onChanged triggered. Namespace:', namespace, 'Changes:', JSON.stringify(changes));
    if (namespace === 'local' && changes.hasOwnProperty('isEnabled')) {
        const oldValue = changes.isEnabled.oldValue;
        const newValue = changes.isEnabled.newValue;
        console.log(`Content Script: storage.onChanged - 'isEnabled' changed from ${oldValue} (type ${typeof oldValue}) to ${newValue} (type ${typeof newValue})`);

        if (typeof newValue === 'boolean') {
            isExtensionEnabled = newValue;
            console.log('Content Script: storage.onChanged - Updated isExtensionEnabled to:', isExtensionEnabled);
        } else {
            console.warn('Content Script: storage.onChanged - Received non-boolean value for isEnabled. Value:', newValue, 'Type:', typeof newValue, 'Keeping isExtensionEnabled as is:', isExtensionEnabled);
            // 可以考慮一個預設行為，例如如果收到非布林值，則禁用或保持原樣
            // isExtensionEnabled = false; // 或者 isExtensionEnabled = true;
        }
    }
});

document.addEventListener('copy', handleCopyEvent, true);