# Loading Screen Implementation Plan

## Problem Statement
When players spawn, Hytopia takes 5-6 seconds to load player data and generate mines. During this time, players are in the game world but cannot meaningfully interact, creating a confusing and poor user experience. Players see their character but no pickaxe, cannot mine, and have no indication of what's happening.

## Solution Overview
Implement a loading screen that appears immediately when a player joins and remains visible until all critical game data is loaded and the player is ready to play. The loading screen will prevent player interaction during loading and provide clear feedback about progress.

## Core Requirements

### 1. Loading States & Triggers
**Show Loading Screen When:**
- Player joins world (PlayerEvent.JOINED_WORLD)
- Player needs to reconnect/rejoin after disconnect

**Hide Loading Screen When:**
- Player data fully loaded from persistence
- Mine generation completed
- Pickaxe equipped
- UI fully initialized
- All critical systems ready

**Loading Steps (in order):**
1. Player entity spawned
2. Camera locked and positioned
3. Pickaxe equipped with correct tier
4. Mine initialized/generated
5. Player data loaded and UI updated
6. All systems ready for interaction

### 2. Loading Screen UI Design

#### Visual Elements
- **Background**: Semi-transparent dark overlay (70% opacity)
- **Loading Spinner**: Animated rotating icon or progress bar
- **Title Text**: "Loading Mining Simulator..."
- **Status Text**: Dynamic status messages
  - "Spawning player..."
  - "Loading your equipment..."
  - "Generating your mine..."
  - "Loading game data..."
  - "Ready to mine!"
- **Progress Indicator**: Optional percentage or step counter
- **Branding**: Game logo or mining-themed graphics

#### UI Technical Details
- **UI Template**: `loading-screen.html`
- **CSS Classes**: `loading-screen`, `loading-spinner`, `loading-text`
- **Data Binding**: Status text updates via `player.ui.sendData()`
- **Positioning**: Full-screen overlay, centered content
- **Z-Index**: Above all other UI elements

### 3. Player State During Loading

#### Restrictions
- **Movement Disabled**: Prevent WASD/input during loading
- **Interaction Blocked**: Disable left-click mining
- **UI Access Limited**: Block modal openings (shop, rebirth, etc.)
- **Chat Available**: Allow chat messages during loading
- **Camera Locked**: Maintain locked zoom and position

#### Visual State
- Player character visible but non-interactive
- Pickaxe appears during "Loading your equipment..." phase
- Mine generates in background
- UI updates progressively

### 4. Integration Points

#### Player Join Flow (Modified)
```
Player Joins World
    ↓
Show Loading Screen ("Spawning player...")
    ↓
Spawn Player Entity
    ↓
Lock Camera & Setup Input
    ↓
Update Status ("Loading your equipment...")
    ↓
Load Saved Data (Async)
    ↓
Equip Pickaxe with Correct Tier
    ↓
Update Status ("Generating your mine...")
    ↓
Initialize Player Mine
    ↓
Update Status ("Loading game data...")
    ↓
Load UI & Send Initial Stats
    ↓
Update Status ("Ready to mine!")
    ↓
Hide Loading Screen
    ↓
Enable Full Player Interaction
```

#### Code Integration Points
- **index.ts**: PlayerEvent.JOINED_WORLD handler
- **GameManager**: initializePlayerAsync, initializePlayerMine
- **PickaxeManager**: attachPickaxeToPlayer
- **UI System**: New loading screen template and data binding

### 5. Error Handling & Fallbacks

#### Loading Failures
- **Data Load Failure**: Show "Failed to load save data. Using defaults..." (3 second timeout)
- **Mine Generation Failure**: Show "Mine generation failed. Please reconnect." (with retry option)
- **UI Load Failure**: Show "UI failed to load. Some features may not work." (continue anyway)

#### Timeout Handling
- **Maximum Load Time**: 15 seconds total
- **Per-Step Timeouts**: 5 seconds per major step
- **Force Completion**: If loading takes too long, hide screen and enable limited functionality

#### Recovery Options
- **Reconnect Button**: If loading fails completely
- **Continue Anyway**: If minor systems fail but core gameplay works

### 6. Performance Considerations

#### Loading Optimization
- **Parallel Loading**: Load data and generate mine simultaneously where possible
- **Progressive UI**: Update loading screen with actual progress, not fake timers
- **Memory Management**: Clean up loading assets after completion

#### User Experience
- **Perceived Speed**: Show progress immediately, even if actual loading takes time
- **No Fake Progress**: Use real loading states, not arbitrary timers
- **Smooth Transitions**: Fade out loading screen over 0.5 seconds

### 7. Implementation Architecture

#### New Components Needed
- **LoadingScreenManager**: Singleton class managing loading state
- **LoadingScreenUI**: Handles UI updates and transitions
- **LoadingState**: Enum for current loading phase

#### Modified Components
- **Player Join Handler**: Integrate loading screen triggers
- **GameManager**: Add loading state callbacks
- **UI System**: Add loading screen template support

#### State Management
```typescript
enum LoadingState {
  SPAWNING_PLAYER = 'spawning_player',
  LOADING_EQUIPMENT = 'loading_equipment',
  GENERATING_MINE = 'generating_mine',
  LOADING_DATA = 'loading_data',
  READY = 'ready'
}

interface LoadingScreenData {
  visible: boolean;
  status: string;
  progress?: number;
  showReconnectButton?: boolean;
}
```

### 8. Testing & Validation

#### Test Scenarios
- **New Player**: No saved data, fast loading
- **Returning Player**: Large save file, slow loading
- **Network Issues**: Simulate slow connections
- **Loading Failures**: Test error handling paths
- **Reconnection**: Player reconnects mid-loading

#### Performance Metrics
- **Load Time Distribution**: Track average loading times
- **Drop-off Points**: Monitor where players disconnect during loading
- **Success Rate**: Track percentage of successful loadings

### 9. Future Enhancements

#### Phase 2 Features
- **Loading Tips**: Random mining tips during load
- **Social Features**: Show online friends loading
- **Background Music**: Loading screen music
- **Customizable Loading**: Player-selected loading themes

#### Analytics Integration
- **Loading Performance**: Track load times by device/platform
- **User Behavior**: Monitor interaction during loading screen
- **Conversion Tracking**: Loading screen to gameplay conversion rates

## Implementation Priority
1. **Core Loading Screen**: Basic show/hide with status text
2. **State Integration**: Hook into existing loading flow
3. **Error Handling**: Robust failure recovery
4. **Performance Optimization**: Reduce actual loading times
5. **Polish & UX**: Animations, tips, smooth transitions

## Success Criteria
- Loading screen appears immediately on join
- No interaction possible during loading
- Clear progress indication
- Smooth transition to gameplay
- < 3 second total loading experience (perceived)
- Graceful handling of all error cases
