document.addEventListener('DOMContentLoaded', function() {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusText = document.getElementById('statusText');

    console.log("Popup: DOMContentLoaded - script running.");

    // 載入目前狀態
    chrome.storage.local.get(['isEnabled'], function(result) {
        console.log("Popup: storage.get callback. Raw result:", result);
        const isEnabled = result.isEnabled === undefined ? true : result.isEnabled; // 預設啟用
        toggleSwitch.checked = isEnabled;
        updateStatusText(isEnabled);
        console.log("Popup: Initial state loaded. isEnabled in storage was:", result.isEnabled, "UI set to:", isEnabled);
    });

    // 監聽開關變化
    toggleSwitch.addEventListener('change', function() {
        const newCheckedState = toggleSwitch.checked;
        console.log('Popup: Toggle switch changed. New checked state:', newCheckedState);
        chrome.storage.local.set({isEnabled: newCheckedState}, function() {
            if (chrome.runtime.lastError) {
                console.error('Popup: Error setting storage:', chrome.runtime.lastError.message);
            } else {
                console.log('Popup: Successfully set storage isEnabled to ' + newCheckedState);
            }
            updateStatusText(newCheckedState);
        });
    });

    function updateStatusText(isEnabled) {
        statusText.textContent = isEnabled ? 'Enabled' : 'Disabled';
        console.log("Popup: Status text updated to:", statusText.textContent);
    }
});