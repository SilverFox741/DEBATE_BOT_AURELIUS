# Voice Functionality Debugging Guide

## Quick Debug Steps

### 1. Check Browser Support
Open browser console and run:
```javascript
console.log('Speech Recognition:', 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
console.log('Speech Synthesis:', 'speechSynthesis' in window);
```

### 2. Check Permissions
- Ensure microphone access is granted
- Check browser settings for microphone permissions
- Try refreshing the page after granting permissions

### 3. Test Voice Service
In browser console:
```javascript
// Test voice support
console.log('Voice support:', window.voiceService?.isSupported());

// Test speech synthesis
window.voiceService?.speak('Test message', 
  () => console.log('Started'), 
  () => console.log('Ended'), 
  (error) => console.error('Error:', error)
);
```

## Common Issues & Solutions

### Issue: "Speech recognition not supported"
**Solution:**
- Use Chrome or Edge browser
- Ensure HTTPS connection (required for voice features)
- Check if microphone permissions are granted

### Issue: "Failed to start speech recognition"
**Solution:**
- Refresh the page
- Check microphone permissions in browser settings
- Try a different browser
- Ensure stable internet connection

### Issue: Poor recognition accuracy
**Solution:**
- Speak clearly and at normal pace
- Reduce background noise
- Check microphone quality
- Try different language settings

### Issue: Voice output not working
**Solution:**
- Check system volume
- Verify voice selection in settings
- Ensure browser supports speech synthesis
- Try different voice options

### Issue: Recognition stops unexpectedly
**Solution:**
- Check microphone permissions
- Refresh page and try again
- Ensure stable internet connection
- Check browser console for errors

## Browser Compatibility
Works best on Google Chrome/ Microsoft Edge

## Debug Console Commands

### Test Voice Support
```javascript
// Check if voice service is available
console.log('Voice service:', window.voiceService);

// Test support
console.log('Supported:', window.voiceService?.isSupported());

// Check recognition status
console.log('Listening:', window.voiceService?.getListeningStatus());

// Check synthesis status
console.log('Speaking:', window.voiceService?.getSpeakingStatus());
```

### Test Speech Recognition
```javascript
// Start listening
window.voiceService?.startListening(
  (result) => console.log('Result:', result),
  (error) => console.error('Error:', error),
  () => console.log('Started'),
  () => console.log('Ended')
);

// Stop listening
window.voiceService?.stopListening();
```

### Test Speech Synthesis
```javascript
// Speak text
window.voiceService?.speak(
  'Hello, this is a test.',
  () => console.log('Started speaking'),
  () => console.log('Finished speaking'),
  (error) => console.error('Speech error:', error)
);

// Stop speaking
window.voiceService?.stopSpeaking();
```

## Performance Monitoring

### Check Memory Usage
```javascript
// Monitor memory usage during voice operations
const startMemory = performance.memory?.usedJSHeapSize;
// ... perform voice operation ...
const endMemory = performance.memory?.usedJSHeapSize;
console.log('Memory used:', endMemory - startMemory, 'bytes');
```

### Check Recognition Accuracy
```javascript
// Monitor confidence levels
let totalConfidence = 0;
let resultCount = 0;

window.voiceService?.startListening(
  (result) => {
    totalConfidence += result.confidence;
    resultCount++;
    console.log('Average confidence:', totalConfidence / resultCount);
  },
  (error) => console.error('Error:', error)
);
```

## Error Logging

### Enable Detailed Logging
```javascript
// Add to voice service for debugging
console.log('Voice service initialized');
console.log('Recognition config:', recognitionConfig);
console.log('Synthesis config:', synthesisConfig);
```

### Common Error Messages
- `"Speech recognition not supported"` - Browser doesn't support Web Speech API
- `"Failed to start speech recognition"` - Permission or initialization issue
- `"Speech synthesis error"` - Voice synthesis failed
- `"No text to speak"` - Empty text provided for synthesis

## Testing Checklist

- [ ] Browser supports Web Speech API
- [ ] Microphone permissions granted
- [ ] HTTPS connection (if required)
- [ ] Voice service initializes without errors
- [ ] Speech recognition starts successfully
- [ ] Speech synthesis works
- [ ] Error handling works correctly
- [ ] Voice settings are applied
- [ ] Continuous recognition works
- [ ] Error correction suggestions appear

## Troubleshooting Steps

1. **Check Browser Console** for error messages
2. **Verify Permissions** for microphone access
3. **Test in Different Browser** to isolate issues
4. **Check Network Connection** for stability
5. **Restart Application** to clear any state issues
6. **Clear Browser Cache** if needed
7. **Update Browser** to latest version
8. **Check System Audio** for output issues

## Performance Tips

- Use Chrome or Edge for best performance
- Ensure stable internet connection
- Close unnecessary browser tabs
- Use high-quality microphone
- Speak clearly and at normal pace
- Reduce background noise
- Keep browser updated

## Support Information

If issues persist:
1. Check browser console for detailed error messages
2. Test in different browsers
3. Verify microphone hardware is working
4. Check system audio settings
5. Try on different device/network 
