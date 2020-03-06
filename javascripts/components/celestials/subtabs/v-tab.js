"use strict";

Vue.component("v-tab", {
  data() {
    return {
      mainUnlock: false,
      totalUnlocks: 0,
      realities: 0,
      totalGlyphSacrifice: 0,
      infinities: new Decimal(0),
      eternities: new Decimal(0),
      dilatedTime: new Decimal(0),
      replicanti: new Decimal(0),
      rm: new Decimal(0),
      pp: 0,
      showReduction: false,
      reductionCost: 0,
      canReduce: false,
      runRecords: [],
      runGlyphs: [],
      isFlipped: false
    };
  },
  methods: {
    update() {
      this.mainUnlock = V.has(V_UNLOCKS.V_ACHIEVEMENT_UNLOCK);
      this.totalUnlocks = V.spaceTheorems;
      this.realities = player.realities;
      this.totalGlyphSacrifice = Object.values(player.reality.glyphs.sac).sum();
      this.infinities.copyFrom(player.infinitied);
      this.eternities.copyFrom(player.eternities);
      this.dilatedTime.copyFrom(player.dilation.dilatedTime);
      this.replicanti.copyFrom(player.replicanti.amount);
      this.rm.copyFrom(player.reality.realityMachines);
      this.pp = player.reality.pp;
      this.showReduction = V.has(V_UNLOCKS.SHARD_REDUCTION);
      this.reductionCost = this.calculateReductionCost();
      // The second half of this conditional prevents the player from wasting pp on reduction that doesn't do anything
      this.canReduce = this.pp > this.reductionCost &&
        V.tierReduction < 100 * player.celestials.v.runUnlocks.max();
      this.runRecords = Array.from(player.celestials.v.runRecords);
      this.runGlyphs = player.celestials.v.runGlyphs.map(gList => Glyphs.copyForRecords(gList));
      this.isFlipped = V.isFlipped;
    },
    startRun() {
      V.startRun();
    },
    has(info) {
      return V.has(info);
    },
    mode(hex) {
      return hex.config.mode === V_REDUCTION_MODE.SUBTRACTION ? "reduced" : "divided";
    },
    reductionValue(hex) {
      return hex.config.mode === V_REDUCTION_MODE.SUBTRACTION
        ? formatInt(hex.reduction)
        : format(Decimal.pow10(hex.reduction));
    },
    showRecord(hex) {
      return this.runRecords[hex.id] > 0 || hex.completions > 0;
    },
    rewardText(milestone) {
      return typeof milestone.reward === "function"
        ? milestone.reward()
        : milestone.reward;
    },
    reduceGoals() {
      if (!this.canReduce) return;
      player.reality.pp -= this.reductionCost;
      player.celestials.v.ppSpent += this.reductionCost;
    },
    calculateReductionCost() {      
      if (!this.isFlipped) return 2000;
      const nextPercent = (Math.floor(100 * V.tierReduction) + 1) / 100;
      return 20000 * Math.ceil(Math.pow(10, 10 * nextPercent)) - player.celestials.v.ppSpent;
    }
  },
  computed: {
    // If V is flipped, change the layout of the grid
    hexGrid() {
      return this.isFlipped ? [
        VRunUnlocks.all[6],
        {},
        {},
        {},
        { isRunButton: true },
        VRunUnlocks.all[7],
        VRunUnlocks.all[8],
        {},
        {}
      ]
      : [
        VRunUnlocks.all[0],
        VRunUnlocks.all[1],
        {},
        VRunUnlocks.all[2],
        { isRunButton: true },
        VRunUnlocks.all[3],
        VRunUnlocks.all[4],
        VRunUnlocks.all[5],
        {}
      ];
    },
    vUnlock: () => V_UNLOCKS.V_ACHIEVEMENT_UNLOCK,
    runMilestones() {
      return [
        [
          V_UNLOCKS.SHARD_REDUCTION,
          V_UNLOCKS.ND_POW,
          V_UNLOCKS.FAST_AUTO_EC
        ],
        [
          V_UNLOCKS.AUTO_AUTOCLEAN,
          V_UNLOCKS.ACHIEVEMENT_BH,
          V_UNLOCKS.RA_UNLOCK
        ],
      ];
    },
    db: () => GameDatabase.celestials.v,
  },
  template:
    `<div class="l-v-celestial-tab">
      <div v-if="!mainUnlock">
        {{ format(rm, 2, 0) }} / {{ format(db.mainUnlock.rm, 2, 0) }} RM
        <br>
        {{ format(realities, 2, 0) }} / {{ format(db.mainUnlock.realities, 2, 0) }} realities
        <br>
        {{ format(eternities, 2, 0) }} / {{ format(db.mainUnlock.eternities, 2, 0) }} eternities
        <br>
        {{ format(infinities, 2, 0) }} / {{ format(db.mainUnlock.infinities, 2, 0) }} infinities
        <br>
        {{ format(dilatedTime, 2, 0) }} / {{ format(db.mainUnlock.dilatedTime, 2, 0) }} dilated time
        <br>
        {{ format(replicanti, 2, 0) }} / {{ format(db.mainUnlock.replicanti, 2, 0) }} replicanti
        <br>
        {{ format(totalGlyphSacrifice, 2, 0) }} / {{ format(db.mainUnlock.totalGlyphSacrifice, 2, 0) }}
        total glyph sacrifice power
        <br>
        <div class="l-v-milestones-grid__row">
          <div class="o-v-milestone">
            <p>{{ vUnlock.description }}</p>
            <p>Reward: {{ rewardText(vUnlock) }}</p>
          </div>
        </div>
      </div>
      <div v-else>
        <div v-if="isFlipped">
          Cursed glyphs can be created in the Effarig tab, and the Black Hole can now be used to slow down time.
          <br>
          Each hard V-achievement will award {{ formatInt(2) }} Space Theorems instead of {{ formatInt(1) }}.
          <br>
          Goal reduction is significantly more expensive for hard V-achievements.
        </div>
        <div class="l-v-unlocks-container">
          <li v-for="hex in hexGrid">
            <div v-if="hex.config"
              class="l-v-hexagon c-v-unlock"
              :class="{ 'c-v-unlock-completed': hex.completions == 6 }">
                <p class="o-v-unlock-name">{{ hex.config.name }}</p>
                <p class="o-v-unlock-desc" v-html="hex.formattedDescription"></p>
                <p class="o-v-unlock-goal-reduction" v-if="has(runMilestones[0]) && hex.isReduced">
                  Goal has been {{ mode(hex) }} by {{ reductionValue(hex) }} {{ hex.reductionInfo }}
                </p>
                <p class="o-v-unlock-amount">{{ hex.completions }}/{{hex.config.values.length}} done</p>
                <div v-if="showRecord(hex)">
                  <p class="o-v-unlock-record">
                    Best: {{ hex.config.formatRecord(runRecords[hex.id]) }}
                  </p>
                  <p>
                    <glyph-set-preview
                      :show=true
                      :glyphs="runGlyphs[hex.id]" />
                  </p>
                </div>
            </div>
            <div v-else-if="hex.isRunButton" @click="startRun()" class="l-v-hexagon o-v-run-button">
              <p>
              Start V's Reality.<br/>All dimension multipliers, EP gain, IP gain, and dilated time gain per second
              are square-rooted, and Replicanti interval is squared.
              </p>
            </div>
            <div v-else>
              <div style="opacity: 0" class="l-v-hexagon"></div>
            </div>
          </li>
        </div>
        <div>
          V-achievements can only be completed within V's reality, but are permanent and do not reset upon leaving
          and re-entering the reality.
        </div>
        <div>
          You have {{ formatInt(totalUnlocks) }} V-achievements done. You gain 1 Space Theorem for each completion,
          allowing you to purchase time studies which are normally locked.
        </div>
        <br>
        <div v-if="showReduction">
          <button
            class="o-primary-btn"
            :class="{ 'o-primary-btn--disabled': !canReduce }"
            @click="reduceGoals()">
              Spend {{ format(reductionCost, 2, 0) }} PP to reduce all goals by 1% of a tier
          </button>
          <br>
          (You currently have {{ format(pp, 2, 0) }} {{"Perk Point" | pluralize(pp)}})
        </div>
        <div class="l-v-milestones-grid">
          <div v-for="row in runMilestones" class="l-v-milestones-grid__row">
            <div class="o-v-milestone"
              v-for="milestone in row"
              :class="{'o-v-milestone-unlocked':
              has(milestone)}">
                <p>{{ milestone.description }}</p>
                <p>Reward: {{ rewardText(milestone) }}</p>
                <p v-if="milestone.effect">Currently: <b>{{ milestone.format(milestone.effect()) }}</b></p>
            </div>
          </div>
        </div>
      </div>
    </div>`
});
