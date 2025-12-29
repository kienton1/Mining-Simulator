/**
 * Chest Block
 * 
 * Represents a chest block that can be mined for gems.
 * Tracks HP and chest type (basic or golden).
 * 
 * Reference: Planning/GemsSystemPlan.md section 1.1
 */

/**
 * Chest type enumeration
 */
export enum ChestType {
  BASIC = 'basic',
  GOLDEN = 'golden',
}

/**
 * Chest Block class
 * Represents a chest that can be mined for gems
 */
export class ChestBlock {
  /** Type of chest (basic or golden) */
  chestType: ChestType;
  
  /** Maximum HP of the chest (normalized to player damage) */
  maxHP: number;
  
  /** Current HP of the chest */
  currentHP: number;
  
  /** Whether HP has been initialized (set on first hit) */
  private hpInitialized: boolean;

  /**
   * Creates a new chest block
   * HP will be initialized on first hit based on player's damage
   * 
   * @param chestType - Type of chest (basic or golden)
   */
  constructor(chestType: ChestType) {
    this.chestType = chestType;
    this.maxHP = 0;
    this.currentHP = 0;
    this.hpInitialized = false;
  }

  /**
   * Initializes chest HP based on player's damage per hit
   * Called on first hit to normalize durability
   * 
   * @param playerDamagePerHit - Player's damage per hit
   */
  initializeHP(playerDamagePerHit: number): void {
    if (this.hpInitialized) return; // Already initialized
    
    // Normalized durability: Basic = 3 hits, Golden = 6 hits
    const hitsRequired = this.chestType === ChestType.BASIC ? 3 : 6;
    this.maxHP = playerDamagePerHit * hitsRequired;
    this.currentHP = this.maxHP;
    this.hpInitialized = true;
  }

  /**
   * Deals damage to the chest
   * Initializes HP on first hit if not already initialized
   * 
   * @param damage - Amount of damage to deal
   * @returns True if chest was destroyed
   */
  takeDamage(damage: number): boolean {
    // Initialize HP on first hit if not already done
    if (!this.hpInitialized) {
      this.initializeHP(damage);
    }
    
    this.currentHP -= damage;
    if (this.currentHP <= 0) {
      this.currentHP = 0;
      return true; // Chest destroyed
    }
    return false; // Chest still alive
  }

  /**
   * Gets the gem reward for this chest type
   * 
   * @returns Number of gems awarded when chest is broken
   */
  getGemReward(): number {
    return this.chestType === ChestType.BASIC ? 2 : 10;
  }
}

