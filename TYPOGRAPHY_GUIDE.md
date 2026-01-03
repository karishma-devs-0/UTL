# Android Material Design Typography Guide

## Overview
This application now uses Android Material Design Typography standards for consistent, professional text styling across all screens.

## Typography Scale

### Headlines
- **headline1**: 96px, Light (300), -1.5px letter-spacing - For very large displays
- **headline2**: 60px, Light (300), -0.5px letter-spacing - For large displays  
- **headline3**: 48px, Regular (400), 0px letter-spacing - For large text
- **headline4**: 34px, Regular (400), 0.25px letter-spacing - For large text
- **headline5**: 24px, Regular (400), 0px letter-spacing - For section headers
- **headline6**: 20px, Medium (500), 0.15px letter-spacing - For subsection headers

### Subtitles
- **subtitle1**: 16px, Regular (400), 0.15px letter-spacing - For secondary content
- **subtitle2**: 14px, Medium (500), 0.1px letter-spacing - For secondary content

### Body Text
- **body1**: 16px, Regular (400), 0.5px letter-spacing - For main content
- **body2**: 14px, Regular (400), 0.25px letter-spacing - For secondary content

### UI Elements
- **button**: 14px, Medium (500), 1.25px letter-spacing, UPPERCASE - For buttons
- **caption**: 12px, Regular (400), 0.4px letter-spacing - For captions
- **overline**: 10px, Regular (400), 1.5px letter-spacing, UPPERCASE - For labels

## Font Families

### Android
- **Regular**: Roboto
- **Medium**: Roboto-Medium
- **Light**: Roboto-Light
- **Thin**: Roboto-Thin

### iOS
- **All weights**: San Francisco (fallback)

### Default/Web
- **All weights**: System font (fallback)

## Usage Examples

### In Components
```javascript
import { TYPOGRAPHY, FONT_FAMILY } from '../styles/style';

// For headlines
<Text style={{
  ...TYPOGRAPHY.headline5,
  fontFamily: FONT_FAMILY.medium,
  color: '#333'
}}>
  Section Title
</Text>

// For body text
<Text style={{
  ...TYPOGRAPHY.body1,
  fontFamily: FONT_FAMILY.regular,
  color: '#666'
}}>
  Main content text
</Text>

// For buttons
<Text style={{
  ...TYPOGRAPHY.button,
  fontFamily: FONT_FAMILY.medium,
  color: '#fff'
}}>
  BUTTON TEXT
</Text>
```

### In Styles
```javascript
headerTitle: {
  ...TYPOGRAPHY.headline5,
  fontFamily: FONT_FAMILY.medium,
  color: '#333',
  textAlign: 'center',
},
bodyText: {
  ...TYPOGRAPHY.body1,
  fontFamily: FONT_FAMILY.regular,
  color: '#666',
  lineHeight: 24,
},
buttonText: {
  ...TYPOGRAPHY.button,
  fontFamily: FONT_FAMILY.medium,
  color: '#fff',
}
```

## Implementation Status

### ✅ Completed Screens
- Login Screen - Email icon, password visibility toggle, Material typography
- Register Screen - Complete Material Design implementation with icons and typography
- Plant Detail Screen - Chart validation and error prevention

### ✅ Updated Components
- All input fields with proper typography
- All button styles with Material typography
- Headers and titles with headline typography
- Body text with consistent spacing and font weights

### ✅ Typography Applied To
- Login/Register forms
- Headers and navigation
- Button text
- Input fields and labels
- Modal and dialog text
- Tab navigation text
- Error and status messages

## Benefits

1. **Consistency**: All text follows Material Design standards
2. **Accessibility**: Proper font sizes and weights improve readability
3. **Platform Integration**: Looks native on Android devices
4. **Scalability**: Easy to maintain and extend typography
5. **Performance**: Optimized font loading and rendering

## Maintenance

- Typography constants are centralized in `src/styles/style.js`
- Use `TYPOGRAPHY`, `FONT_FAMILY`, and `COLORS` exports for new components
- Follow Material Design guidelines for any new text styles
- Test typography on various screen sizes and Android versions

## Material Design Resources

- [Material Design Typography](https://material.io/design/typography/the-type-system.html)
- [Android Typography Guidelines](https://developer.android.com/design/ui/mobile/guides/foundations/typography)
- [Roboto Font Family](https://fonts.google.com/specimen/Roboto)
