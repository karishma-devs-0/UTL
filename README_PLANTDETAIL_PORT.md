# UTL Solar App - Port from src2 to src

## What we did
- **Batch Command / Protect Parameter / Customized Command**: Ported the full `ProtectParameterScreen` from `src2` to `src`, preserving the commented-out Batch Command section exactly as in `src2`. Implemented the active Customized command tab with DC/AC voltage inputs and API send actions.
- **Command Service**: Added `customizedCommandService.js` with `sendDcCommand` and `sendAcCommand` functions.
- **Navigation**: Registered `ProtectParameterScreen` in `AppNavigator.js` and wired the Inverter “Remote Control” menu flow from `InverterParametersScreen.js` to open `ProtectParameterScreen`.
- **Inverter AppBar**: Extended `InverterAppBar.js` to support optional menu button and right-action button props, matching `src2`.
- **Plant History Data (Chart Validation)**: Ported chart validation and sanitization logic from `src2/screens/PlantDetail.js` to `src/screens/PlantDetail.js`:
  - Enforced minimum 2 data points in `validateChartData()`.
  - Allowed the Total tab to render when `totalChartData.labels.length === 1`.
  - Preserved existing commented code sections as in `src2`.

## Files changed
- `src/screens/ProtectParameterScreen.js` (created)
- `src/services/customizedCommandService.js` (created)
- `src/navigation/AppNavigator.js` (import + stack screen registration)
- `src/screens/inverter/InverterAppBar.js` (menu/right-action props)
- `src/screens/inverter/InverterParametersScreen.js` (command menu modal + navigation)
- `src/screens/PlantDetail.js` (chart validation and Total tab condition)

## Next
- Verify Android build resolves Gradle linking issue for native modules (autolinking/variant resolution).

## Repo
- https://github.com/karishma-devs-0/UTL
