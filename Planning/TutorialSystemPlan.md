# Tutorial System Planning

## Overview
Create a comprehensive tutorial system that guides new players through the core gameplay loop: mining, selling, training, and pets. The tutorial should be progressive, non-intrusive, and provide clear visual cues and instructions.

## Tutorial Flow Structure

### Phase 1: Getting to the Mines
**Goal**: Guide player from spawn to the mine entrance

**Visual Elements**:
- **Directional Arrows**: Client arrow from the player entity to the mine entrance (HytopiaUI.connectArrow)
- **Top-Right UI Panel**: "Enter Mines" instruction with progress indicator
- **Ground Markers**: Optional glowing path markers on the ground

**Trigger Conditions**:
- Player spawns for the first time (new player detection via save data)
- Player is within 50 blocks of spawn area
- No tutorial progress saved

**Completion Criteria**:
- Player enters the mine area (crosses mine entrance threshold)
- Automatically hides arrows and updates tutorial phase

### Phase 2: Mining Basics
**Goal**: Teach player to mine 5 ores

**Visual Elements**:
- **Directional Arrow**: Player -> nearest highlighted ore target (connectArrow to block position)
- **Mining Highlight**: Glowing outline around nearby mineable blocks
- **Progress UI**: Top-right panel showing "Mine 5 Ores (0/5)"
- **Tooltips**: Contextual hints when looking at blocks
- **Success Feedback**: Celebration animation when reaching milestones

**Mechanics**:
- Highlight 5 specific ore blocks in easy-to-reach locations
- Track mining progress per player
- Prevent progression to next phase until 5 ores mined
- Provide mining assistance (reduced durability loss, guaranteed drops)

**Completion Criteria**:
- Player mines exactly 5 ores (tracked via mining events)
- Automatically transitions to selling phase

### Phase 3: Selling Ores
**Goal**: Teach player how to sell mined ores

**Visual Elements**:
- **Directional Arrow**: Player -> merchant NPC entity (connectArrow to merchant entity ID)
- **Merchant Highlight**: Glowing effect around the merchant NPC
- **UI Guidance**: Top-right panel with "Sell Your Ores" and inventory hints
- **Interactive Prompts**: "Press E to sell" when near merchant
- **Sale Confirmation**: Clear feedback showing gold earned

**Mechanics**:
- Guide player to merchant location
- Highlight sellable items in inventory
- Demonstrate selling process
- Show gold reward prominently

**Completion Criteria**:
- Player successfully sells at least 1 ore
- Player has gold in their inventory
- Automatically transitions to training phase

### Phase 4: Training Introduction
**Goal**: Teach player about the training system

**Visual Elements**:
- **Directional Arrow**: Player -> selected training rock position (connectArrow to block position)
- **Training Rock Highlight**: Glowing effect on accessible training rocks
- **Progress UI**: "Complete Training" with requirements shown
- **Power Gain Visualization**: Animated power increases during training
- **Requirement Display**: Clear power/rebirth requirements

**Mechanics**:
- Select appropriate training rock (lowest tier available)
- Guide player through training interaction
- Show power gain in real-time
- Complete one training session

**Completion Criteria**:
- Player completes one training session
- Player gains power
- Automatically transitions to pet purchasing phase

### Phase 5: Pet Acquisition
**Goal**: Give player money and teach pet purchasing

**Visual Elements**:
- **Directional Arrow**: Player -> pet merchant entity (connectArrow to pet merchant entity ID)
- **Pet Shop Highlight**: Glowing effect around pet merchant
- **UI Guidance**: "Buy Your First Pet" with cost display
- **Gold Reward Notification**: "Tutorial Reward: X Gold!"
- **Pet Selection**: Highlight cheapest available pet

**Mechanics**:
- Automatically grant player enough gold for cheapest pet
- Guide to pet merchant location
- Highlight pet purchase options
- Show cheapest pet clearly

**Completion Criteria**:
- Player purchases a pet (any tier, but cheapest recommended)
- Player has pet in inventory
- Automatically transitions to hatching phase

### Phase 6: Pet Hatching
**Goal**: Teach player how to hatch purchased pets

**Visual Elements**:
- **Directional Arrow**: Player -> egg station entity/position (connectArrow to station entity ID or barrel position)
- **Egg Station Highlight**: Glowing effect around egg stations
- **UI Guidance**: "Hatch Your Pet" with egg selection
- **Hatching Animation**: Special tutorial hatching effects
- **Progress Tracking**: Show hatching progress

**Mechanics**:
- Guide to appropriate egg station
- Show egg selection interface
- Demonstrate hatching process
- Celebrate pet hatching

**Completion Criteria**:
- Player successfully hatches a pet
- Player has hatched pet in inventory
- Automatically transitions to equipping phase

### Phase 7: Pet Equipping
**Goal**: Teach player how to equip hatched pets

**Visual Elements**:
- **Inventory Highlight**: Focus on pet inventory section
- **UI Guidance**: "Equip Your Pet" with clear instructions
- **Equipment Feedback**: Visual confirmation of pet equipping
- **Tutorial Completion**: Celebration and summary

**Mechanics**:
- Show pet inventory interface
- Guide through equipping process
- Demonstrate pet benefits
- Complete tutorial sequence

**Completion Criteria**:
- Player equips at least one pet
- Tutorial system marks as complete
- Player gains full game access

## Technical Implementation Plan

### Core Systems Required

#### Tutorial Manager
- Central coordinator for all tutorial phases
- Player progress tracking and persistence
- Phase transition logic
- Event-driven state updates

#### Tutorial UI System
- Top-right tutorial panel component
- Dynamic content based on current phase
- Progress indicators and instructions
- Contextual hints and tooltips

#### Visual Cue System
- Arrow entity management (client-side HytopiaUI.connectArrow/disconnectArrow)
- Glowing highlight effects (client-side color correction on target entities)
- Ground marker placement
- Animated transitions

#### Directional Arrow System (Client)
- Access the API via the `hytopia` global in your client HTML UI.
- Use `HytopiaUI.connectArrow(source, target, options)` in UI code to render arrows per player.
- Source should be the player's entity ID from `getPlayerEntityId()` (retry until available).
- Target should be a server-sent entity ID (NPCs, stations) or a world position (mine entrance, blocks).
- Store returned `arrowId` per tutorial step and call `disconnectArrow(arrowId)` when the step completes or the target changes.
- Guard `disconnectArrow` calls (the client API throws if the ID does not exist).
- Use `options.color` (r/g/b 0-255) and `textureUri` to brand arrows per phase.
- Use `getEntityIdByName(name)` if you tag tutorial targets with unique entity names.
- Keep at most one primary arrow active to avoid overwhelming players.

#### Progress Tracking
- Mining progress counter
- Training session tracking
- Pet acquisition milestones
- Phase completion validation

### Integration Points

#### Existing Systems to Extend:
- **Mining System**: Add tutorial ore highlighting and progress tracking
- **Shop System**: Integrate tutorial purchasing guidance
- **Training System**: Add tutorial rock selection and guidance
- **Pet System**: Tutorial hatching and equipping guidance
- **Inventory System**: Tutorial item highlighting and management

#### New Tutorial-Specific Components:
- **TutorialArrow**: Client arrow manager (tracks arrow IDs, handles create/update/remove)
- **TutorialHighlight**: Block/entity highlighting system
- **TutorialUI**: Dedicated tutorial interface components
- **TutorialProgress**: Progress persistence and tracking

### Data Persistence
- Tutorial progress saved in player data
- Phase completion flags
- Tutorial rewards granted (prevent duplicate rewards)
- Skip tutorial option for returning players

### Event System Integration
- Hook into existing game events (mining, selling, training, pet actions)
- Tutorial-specific events for phase transitions
- UI update events for tutorial panel
- Visual cue activation/deactivation events

#### Server <-> UI Data Contract (Arrows)
Example message shapes to keep the UI code simple and data-driven:

```ts
// Server -> UI
{ type: 'TUTORIAL_ARROW', action: 'show', key: 'phase1-mine', targetEntityId?: number, targetPosition?: { x: number; y: number; z: number }, color?: { r: number; g: number; b: number }, textureUri?: string }
{ type: 'TUTORIAL_ARROW', action: 'hide', key: 'phase1-mine' }
```

UI should map `key` to `arrowId`, call `connectArrow` on show, and `disconnectArrow` on hide.

## UI/UX Considerations

### Tutorial Panel Design
- **Position**: Top-right corner, non-intrusive
- **Style**: Clean, game-themed design matching existing UI
- **Content**: Dynamic text, progress bars, icons
- **Interactions**: Minimal, mostly informational

### Visual Cue Hierarchy
1. **Primary**: Glowing highlights for target objects
2. **Secondary**: Directional arrows for navigation
3. **Tertiary**: Ground markers for path guidance
4. **Feedback**: Success animations and celebrations

### Accessibility Features
- **Skip Option**: Allow players to skip tutorial phases
- **Repeat Option**: Allow revisiting tutorial steps
- **Clear Instructions**: Simple, actionable language
- **Visual Alternatives**: Multiple cue types for different learning styles

## Progression Balancing

### Reward Structure
- **Mining Phase**: No special rewards (core gameplay)
- **Selling Phase**: Normal gold rewards
- **Training Phase**: Normal power gains
- **Pet Phase**: Gold grant for cheapest pet purchase
- **Completion**: Optional bonus rewards

### Difficulty Scaling
- Start with easiest content (basic ores, simple training)
- Gradually introduce complexity
- Provide assistance during tutorial phases
- Ensure all players can complete regardless of skill level

### Time Estimates
- **Total Tutorial Time**: 5-10 minutes
- **Phase Breakdown**:
  - Getting to Mines: 30 seconds
  - Mining 5 Ores: 2 minutes
  - Selling Ores: 1 minute
  - Training: 1 minute
  - Pet Purchase/Hatching/Equipping: 2 minutes

## Edge Cases & Error Handling

### Player Behavior Handling
- **Wrong Path**: Gentle redirection with visual cues
- **Getting Stuck**: Automatic progression or help prompts
- **Early Completion**: Allow skipping to next phase
- **Multiple Attempts**: Track and reward completion, not attempts

### System Failure Scenarios
- **UI Load Failure**: Fallback to text-only instructions
- **Visual Cue Failure**: Multiple redundant cue systems
- **Progress Loss**: Regular autosave of tutorial state
- **Server Restart**: Resume tutorial from last completed phase

### Multiplayer Considerations
- Tutorial is per-player (not affected by other players)
- Visual cues only show for players in tutorial
- Prevent tutorial interference with regular gameplay

## Success Metrics

### Completion Tracking
- Phase completion rates
- Tutorial abandonment points
- Average completion time
- Skip tutorial usage

### Player Feedback
- Tutorial satisfaction surveys
- Confusion points identification
- Feature discovery success rates
- Long-term retention correlation

## Implementation Phases

### Phase 1: Core Infrastructure
- Tutorial Manager class
- Basic progress persistence
- Phase transition system
- Tutorial UI panel

### Phase 2: Visual Cue System
- Arrow entities and management
- Highlighting system
- Ground markers
- Cue activation logic

### Phase 3: Phase-Specific Logic
- Mine entrance guidance
- Mining progress tracking
- Selling guidance
- Training integration

### Phase 4: Pet System Integration
- Pet purchase guidance
- Hatching tutorial
- Equipping tutorial
- Reward system

### Phase 5: Polish & Testing
- UI/UX refinements
- Error handling improvements
- Performance optimization
- Comprehensive testing

## Future Enhancements

### Advanced Features
- **Dynamic Difficulty**: Adjust tutorial based on player skill
- **Branching Paths**: Different tutorial flows for different playstyles
- **Social Elements**: Multiplayer tutorial segments
- **Achievement System**: Tutorial completion rewards

### Analytics Integration
- Player behavior tracking during tutorial
- Conversion metrics (tutorial completion -> retention)
- A/B testing framework for tutorial variations
- Continuous improvement based on data
