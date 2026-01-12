/**
 * Mine Block
 * 
 * Represents a single block in the mine that can be mined.
 * Tracks HP and ore type.
 * World-aware: Supports both Island 1 (OreType) and Island 2 (ISLAND2_ORE_TYPE) ores.
 * 
 * Reference: Planning/gameOverview.txt section 6.1
 */

/**
 * Mine Block class
 * Represents a block that can be mined
 */
export class MineBlock {
  /** Type of ore in this block (as string to support both Island 1 and Island 2 ores) */
  oreType: string;
  
  /** Maximum HP of the block */
  maxHP: number;
  
  /** Current HP of the block */
  currentHP: number;

  /**
   * Creates a new mine block
   * 
   * @param oreType - Type of ore in this block (as string)
   * @param maxHP - Maximum HP of the block
   */
  constructor(oreType: string, maxHP: number = 100) {
    this.oreType = oreType;
    this.maxHP = maxHP;
    this.currentHP = maxHP;
  }

  /**
   * Deals damage to the block
   * 
   * @param damage - Amount of damage to deal
   * @returns True if block was destroyed
   */
  takeDamage(damage: number): boolean {
    this.currentHP -= damage;
    if (this.currentHP <= 0) {
      this.currentHP = 0;
      return true; // Block destroyed
    }
    return false; // Block still alive
  }

  /**
   * Resets the block to full HP
   */
  reset(): void {
    this.currentHP = this.maxHP;
  }
}

