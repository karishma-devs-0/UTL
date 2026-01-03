# Plant Monitoring App

A React Native application for monitoring plant statistics including AC and DC current/voltage data.

## Features

- View AC and DC electrical data
- Interactive line charts
- Multiple parameter selection
- Date navigation
- Time period filtering (Day/Month/Year/Total)
- Parameter grouping (AC Data, DC Current, DC Voltage, Combined)

## Prerequisites

- Node.js >= 14
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)
- CocoaPods (for iOS development)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd plant-monitoring-app
```

2. Install dependencies:
```bash
npm install
```

3. Install iOS dependencies (iOS only):
```bash
cd ios
pod install
cd ..
```

## Running the App

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## Project Structure

```
src/
  ├── screens/
  │   └── inverter/
  │       └── InverterStatisticsScreen.js
  ├── components/
  ├── navigation/
  └── services/
```

## Dependencies

- react-native-chart-kit: For rendering charts
- react-native-vector-icons: For icons
- react-native-svg: Required for charts
- @react-navigation: For navigation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
