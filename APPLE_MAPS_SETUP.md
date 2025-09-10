# Apple Maps Integration

## Current Implementation
The real estate listings now use Apple Maps for street-level imagery through iframe embedding.

### URL Format
Each listing uses Apple Maps URLs in the format:
```
https://maps.apple.com/?ll=LAT,LNG&spn=0.01,0.01&t=m&z=18&size=400x300
```

### Features
- **Interactive Maps**: Each popup shows an embedded Apple Maps view
- **Street-Level Detail**: High-resolution street-level imagery
- **Recent Imagery**: Apple Maps often has more recent street-level photos
- **No API Key Required**: Uses Apple's public web service

### Technical Details
- **Backend**: Added `map_type: "apple"` field to Listing model
- **Frontend**: Uses iframe embedding for Apple Maps instead of static images
- **Popup Size**: Increased to 320px width to accommodate iframe
- **Height**: 200px iframe height for optimal viewing

### Benefits of Apple Maps
1. **No Authentication**: No API key or billing required
2. **High Quality**: Apple's street-level imagery is often very detailed
3. **Recent Updates**: Apple frequently updates their street-level imagery
4. **Consistent Experience**: Works across all devices and browsers
5. **Interactive**: Users can zoom and pan within the embedded map

### Browser Compatibility
- Works in all modern browsers
- Mobile-friendly responsive design
- Touch-friendly on mobile devices

### Limitations
- **Embedding**: Apple Maps iframes may have some restrictions
- **Performance**: iframes can be slower to load than static images
- **Offline**: Requires internet connection to display maps

## Alternative Options
If Apple Maps doesn't work well for your use case, consider:
- Google Street View Static API (requires API key)
- Mapillary (free street-level imagery)
- Custom hosted images
- OpenStreetView

## Current Status
✅ All 25 listings updated with Apple Maps URLs
✅ Frontend updated to handle iframe embedding
✅ Backend model updated with map_type field
