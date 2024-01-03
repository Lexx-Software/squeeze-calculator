<template>
  <div class="sq-calc-form main-cont">
    <el-config-provider :locale="locale">
      <el-form
        class="form"
        ref="calcFormRef"
        :model="calcForm"
        :rules="calcFormRules"
        label-width="180px"
        size="small"
        :inline="true"
      >
        <div class="main-fields">
          <!-- DATA SETTINGS -->
          <div class="level">
            <span class="title">
              {{ $t('main.dataSettings') }}
            </span>

            <div class="block">
              <el-form-item :label="`${$t('main.exchange')}:`">
                <el-select v-model="calcForm.exchange">
                    <el-option
                        :label="EXCHANGE_TEXT[EXCHANGE.BINANCE]"
                        :value="EXCHANGE.BINANCE"
                    />
                    <el-option
                        :label="EXCHANGE_TEXT[EXCHANGE.BINANCE_FUTURES]"
                        :value="EXCHANGE.BINANCE_FUTURES"
                    />
                </el-select>
              </el-form-item>

              <el-form-item class="fee-item" :label="`${$t('main.fee')} %:`" prop="fee">
                <el-input class="short-input" v-model="calcForm.fee" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item :label="`${$t('main.symbol')}:`" prop="symbol">
                <el-input v-model="calcForm.symbol" />
              </el-form-item>

              
              <el-form-item class="fee-item" :label="`${$t('main.timeframe')}`">
                <el-input class="short-input" v-model="calcForm.timeframe" :disabled="true" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item :label="`${$t('main.time')}:`" prop="time">
                <el-date-picker
                  v-model="calcForm.time"
                  type="datetimerange"
                  range-separator="-"
                  :start-placeholder="$t('main.from')"
                  :end-placeholder="$t('main.to')"
                />
              </el-form-item>
            </div>
          </div>

          <!-- SEARCH AREA -->
          <div class="level">
            <span class="title">
              {{ $t('main.squeezeSearchArea') }}
            </span>

            <div class="block">
              <el-form-item :label="`${$t('main.binding')}:`">
                <el-checkbox v-model="calcForm.binding[SqueezeBindings.LOW]" :label="$t('main.low')" />
                <el-checkbox v-model="calcForm.binding[SqueezeBindings.HIGH]" :label="$t('main.high')" />
                <el-checkbox v-model="calcForm.binding[SqueezeBindings.OPEN]" :label="$t('main.open')" />
                <el-checkbox v-model="calcForm.binding[SqueezeBindings.CLOSE]" :label="$t('main.close')" />
                <el-checkbox v-model="calcForm.binding[SqueezeBindings.MID_HL]" :label="$t('main.midHL')" />
                <el-checkbox v-model="calcForm.binding[SqueezeBindings.MID_OC]" :label="$t('main.midOC')" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item :label="`${$t('main.percentBuy')}:`" prop="percentBuyFrom">
                <el-input-number v-model="calcForm.percentBuyFrom" :precision="1" :step="0.1" :min="0.5" />
              </el-form-item>
              <span class="separator" />
              <el-form-item prop="percentBuyTo">
                <el-input-number v-model="calcForm.percentBuyTo" :precision="1" :step="0.1" :min="0.5" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item :label="`${$t('main.percentSell')}:`" prop="percentSellFrom">
                <el-input-number v-model="calcForm.percentSellFrom" :precision="1" :step="0.1" :min="0.5" />
              </el-form-item>
              <span class="separator" />
              <el-form-item prop="percentSellTo">
                <el-input-number v-model="calcForm.percentSellTo" :precision="1" :step="0.1" :min="0.5" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item class="is-active-checkbox">
                <el-checkbox v-model="calcForm.stopLossTime.isActive" />
              </el-form-item>

              <el-form-item :label="`${$t('main.stopLossTime')}:`">
                <el-input-number v-model="calcForm.stopLossTime.from" :min="0" :disabled="!calcForm.stopLossTime.isActive" />
              </el-form-item>
              <span class="separator" />
              <el-form-item>
                <el-input-number v-model="calcForm.stopLossTime.to" :min="0" :disabled="!calcForm.stopLossTime.isActive" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item class="is-active-checkbox">
                <el-checkbox v-model="calcForm.stopLossPercent.isActive" />
              </el-form-item>

              <el-form-item :label="`${$t('main.stopLossPercent')}:`">
                <el-input-number v-model="calcForm.stopLossPercent.from" :min="0" :disabled="!calcForm.stopLossPercent.isActive" />
              </el-form-item>
              <span class="separator" />
              <el-form-item prop="stopLossTimeTo">
                <el-input-number v-model="calcForm.stopLossPercent.to" :min="0" :disabled="!calcForm.stopLossPercent.isActive" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item label=" ">
                <el-checkbox
                  v-model="calcForm.stopOnKlineClosed"
                  :label="$t('main.stopOnKlineClosed')"
                  :disabled="!calcForm.stopLossPercent.isActive"
                />
              </el-form-item>
            </div>
          </div>
        </div>

        <div class="additional-fields">
          <!-- FILTERS -->
          <div class="level">
            <span class="title">
              {{ $t('main.filters') }}
            </span>

            <div class="block">
              <el-form-item class="is-active-checkbox">
                <el-checkbox v-model="calcForm.minNumDeals.isActive" />
              </el-form-item>

              <el-form-item :label="`${$t('main.minNumDeals')}:`">
                <el-input-number
                  v-model="calcForm.minNumDeals.value"
                  :min="0"
                  :precision="0"
                  :step="1"
                  :disabled="!calcForm.minNumDeals.isActive"
                />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item class="is-active-checkbox">
                <el-checkbox v-model="calcForm.minCoeff.isActive" />
              </el-form-item>

              <el-form-item :label="`${$t('main.minCoeff')}:`">
                <el-input-number
                  v-model="calcForm.minCoeff.value"
                  :min="0"
                  :precision="1"
                  :step="0.1"
                  :disabled="!calcForm.minCoeff.isActive"
                />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item class="is-active-checkbox">
                <el-checkbox v-model="calcForm.minWinRate.isActive" />
              </el-form-item>

              <el-form-item :label="`${$t('main.minWinRate')}:`">
                <el-input-number
                  v-model="calcForm.minWinRate.value"
                  :min="0"
                  :max="1"
                  :precision="2"
                  :step="0.01"
                  :disabled="!calcForm.minWinRate.isActive"
                />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item class="is-active-checkbox">
                <el-checkbox v-model="calcForm.maxSellBuyRatio.isActive" />
              </el-form-item>

              <el-form-item :label="`${$t('main.maxSellBuyRatio')}:`">
                <el-input-number
                  v-model="calcForm.maxSellBuyRatio.value"
                  :min="0"
                  :precision="2"
                  :step="0.01"
                  :disabled="!calcForm.maxSellBuyRatio.isActive"
                />
              </el-form-item>
            </div>
          </div>

          <!-- OPTIMIZATION -->
          <div class="level">
            <span class="title">
              {{ $t('main.optimizationSettings') }}
            </span>

            <div class="block">
              <el-form-item class="is-tooltip" :label="`${$t('main.algorithm')}:`">
                <el-tooltip placement="bottom" effect="light">
                  <template #content>
                    <span v-html="$t('main.algorithmTooltip')" />
                  </template>
                  <img class="icon" src="../assets/img/info.svg" alt="/">
                </el-tooltip>
                <el-select v-model="calcForm.algorithm">
                    <el-option
                        :label="OptimizationAlgorithm.OMG"
                        :value="OptimizationAlgorithm.OMG"
                    />
                    <el-option
                        :label="OptimizationAlgorithm.RANDOM"
                        :value="OptimizationAlgorithm.RANDOM"
                    />
                </el-select>
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item class="is-tooltip" :label="`${$t('main.iterations')}:`">
                <el-tooltip placement="bottom" effect="light">
                  <template #content>
                    <span v-html="$t('main.iterationsTooltip')" />
                  </template>
                  <img class="icon" src="../assets/img/info.svg" alt="/">
                </el-tooltip>
                <el-input-number v-model="calcForm.iterations" :min="0" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item class="is-tooltip" :label="`${$t('main.saveResults')}:`">
                <el-tooltip :content="$t('main.saveResultsTooltip')" placement="bottom" effect="light">
                  <img class="icon" src="../assets/img/info.svg" alt="/">
                </el-tooltip>
                <el-input-number v-model="calcForm.saveResults" :min="0" />
              </el-form-item>
            </div>
          </div>
        </div>
      </el-form>

      <!-- BUTTON -->
      <div class="btn-block">
        <el-button type="success" @click="submitForm" :disabled="loading">
          {{ $t('main.start') }}
        </el-button>
        <el-button @click="clearForm">{{ $t('main.reset') }}</el-button>
      </div>
    </el-config-provider>

    <!-- PROGRESS -->
    <div class="download-block">
      <div class="text-block">
        <span v-if="downloadText" class="item" v-html="downloadText" />
        <span v-if="downloadTimeText" class="item" v-html="downloadTimeText" />
      </div>
      <div class="progress-block">
        <el-progress
          v-if="downloadProgress && Number(downloadProgress) !== 100"
          :percentage="downloadProgress"
          :stroke-width="15"
          striped
        />
      </div>
    </div>

    <!--TABLE-->
    <div v-if="isShowTable" class="table-block">
      <span class="title">
        {{ $t('main.results', {
          exchange: EXCHANGE_TEXT[calcForm.exchange],
          symbol: calcForm.symbol,
          timeframe: calcForm.timeframe,
        }) }} ({{ resultsCount }}):
      </span>
      <el-config-provider :locale="locale">
      <el-table class="table" :data="tableData">
        <el-table-column :label="$t('main.table.binding')">
            <template #default="scope">
                {{ scope.row.binding || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.percentBuy')">
            <template #default="scope">
                {{ scope.row.percentBuy || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.percentSell')">
            <template #default="scope">
                {{ scope.row.percentSell || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.stopLossTime')">
            <template #default="scope">
                {{ scope.row.stopLossTime || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.stopLossPercent')">
            <template #default="scope">
                {{ scope.row.stopLossPercent || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.totalDeals')">
            <template #default="scope">
                {{ scope.row.totalDeals || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.totalProfitPercent')">
            <template #default="scope">
                {{ totalProfitPercent ? `${scope.row.totalProfitPercent}%` : '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.coeff')">
            <template #default="scope">
                {{ scope.row.coeff || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.winrate')">
            <template #default="scope">
                {{ scope.row.winrate || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.action')">
            <template #default="scope">
                {{ scope.row.action }}
                <el-button
                    type="primary"
                    link
                    @click="createStrategy(scope.row)"
                >
                  {{ $t('main.table.create') }}
                </el-button>
            </template>
        </el-table-column>
      </el-table>
      </el-config-provider>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component';
import type { FormRules, FormInstance } from 'element-plus';
import en from 'element-plus/dist/locale/en.mjs';
import ru from 'element-plus/dist/locale/ru.mjs';
import { EXCHANGE, EXCHANGE_TEXT } from '../enum';
import { OptimizationAlgorithm, SqueezeBindings } from 'squeeze-utils';
import { calculateData } from './calculate';
import i18n from '@/i18n';

const { t } = i18n.global;

export default class SqCalcForm extends Vue {
  EXCHANGE = EXCHANGE;
  EXCHANGE_TEXT = EXCHANGE_TEXT;
  OptimizationAlgorithm = OptimizationAlgorithm;
  SqueezeBindings = SqueezeBindings;

  calcForm = {
    exchange: EXCHANGE.BINANCE,
    fee: 0.075,
    symbol: 'BTCUSDT',
    timeframe: '1m',
    time: [],
    binding: {
      [SqueezeBindings.LOW]: true,
      [SqueezeBindings.HIGH]: false,
      [SqueezeBindings.OPEN]: false,
      [SqueezeBindings.CLOSE]: false,
      [SqueezeBindings.MID_HL]: false,
      [SqueezeBindings.MID_OC]: false,
    },
    percentBuyFrom: 1,
    percentBuyTo: 6,
    percentSellFrom: 0.5,
    percentSellTo: 3,
    stopLossTime: {
      isActive: true,
      from: 5,
      to: 60,
    },
    stopLossPercent: {
      isActive: false,
      from: 1,
      to: 10,
    },
    stopOnKlineClosed: true,
    minNumDeals: {
      isActive: false,
      value: 0,
    },
    minCoeff: {
      isActive: false,
      value: 0,
    },
    minWinRate: {
      isActive: false,
      value: 0,
    },
    maxSellBuyRatio: {
      isActive: false,
      value: 0.5,
    },
    algorithm: OptimizationAlgorithm.OMG,
    iterations: 1000,
    saveResults: 20,
  };

  calcFormRules: FormRules = {
    symbol: [{ required: true, message: t('validation.inputValue'), trigger: ['blur', 'change'] }],
    fee: [{ required: true, message: t('validation.inputValue'), trigger: ['blur', 'change'] }],
    time: [{ required: true, message: t('validation.inputValue'), trigger: ['blur', 'change'] }],
    percentBuyFrom: [{ required: true, message: t('validation.inputValue'), trigger: ['blur', 'change'] }],
    percentBuyTo: [{
      validator: (rule, value, callback): void => {
        if (!value) {
            callback(new Error(t('validation.inputValue')));
        } else if (value < this.calcForm.percentBuyFrom) {
            callback(new Error(t('validation.lessThanPrev')));
        } else {
            callback();
        }
      },
      trigger: ['blur', 'change']
    }],
    percentSellFrom: [{ required: true, message: t('validation.inputValue'), trigger: ['blur', 'change'] }],
    percentSellTo: [{
      validator: (rule, value, callback): void => {
        if (!value) {
            callback(new Error(t('validation.inputValue')));
        } else if (value < this.calcForm.percentSellFrom) {
            callback(new Error(t('validation.lessThanPrev')));
        } else {
            callback();
        }
      },
      trigger: ['blur', 'change']
    }]
  }

  downloadText = '';
  downloadTimeText = '';
  downloadProgress = 0;

  setDownloadText(data) {
    if (data.startDownload) {
      this.downloadText = `${t('main.downloading')}... `;
    }
    if (data.downloadTime && Number(data.downloadTime) !== 0) {
      this.downloadTimeText += `${t('main.downloadedIn', { value: data.downloadTime })}. `;
    }
    if (data.startCalculate) {
      this.downloadText = `${t('main.calculating')}... `;
    }
    if (data.calculateTime) {
      this.downloadTimeText += `${t('main.calculatedIn', { value: data.calculateTime })}.`;
    }
    if (data.progress) {
      this.downloadProgress = data.progress;
    }
  }

  loading = false;

  async submitForm(): Promise<void> {
    try {
      this.loading = true;
      this.downloadText = '';
      this.downloadTimeText = '';
      this.tableData = [];
      this.isShowTable = false;
      this.resultsCount = 0;

      if (Object.values(this.calcForm.binding).every((value) => value === false)) {
        throw new Error(t('main.binding'))
      }

      // @ts-ignore
      await this.checkFormValid(this.$refs.calcFormRef);

      const result = await calculateData(this.calcForm, this.setDownloadText);

      this.setTableData(result);

      console.log('Result:', result);
    } catch (err) {
      (this as any).$message({
          type: 'error',
          message: err,
          showClose: true,
          duration: 20000
      });
    } finally {
      this.downloadText = '';
      this.loading = false;
    }
  }

  async checkFormValid(formEl: FormInstance | undefined): Promise<void> {
    if (!formEl) {
        const errMsg = 'Cannot find form ref';
        throw errMsg;
    }
    await formEl.validate((valid) => {
        if (!valid) {
            const errMsg = 'invalid';
            throw errMsg;
        }
    });
  }

  // TABLE

  tableData = [];
  isShowTable = false;
  resultsCount = 0;

  setTableData(data) {
    this.isShowTable = true;
    for (const item of data.dataArr || []) {
      this.resultsCount++
      this.tableData.push({
          binding: item.settings.binding,
          percentBuy: item.settings.percentBuy,
          percentSell: item.settings.percentSell,
          stopLossTime: item.settings.stopLossTime ? item.settings.stopLossTime / (60 * 1000) : undefined,
          stopLossPercent: item.settings.stopLossPercent,
          totalDeals: item.totalDeals,
          totalProfitPercent: item.totalProfitPercent ? item.totalProfitPercent.toFixed(2) : undefined,
          coeff: item.coeff ? item.coeff.toFixed(2) : undefined,
          winrate: item.winRate ? item.winRate.toFixed(2) : undefined,
          symbol: data.symbol,
          exchange: data.exchange,
          stopOnKlineClosed: data.stopOnKlineClosed,
      })
    }
  }

  getBindingForLink(value) {
    switch (value) {
      case SqueezeBindings.LOW: return 'l';
      case SqueezeBindings.HIGH: return 'h';
      case SqueezeBindings.OPEN: return 'o';
      case SqueezeBindings.CLOSE: return 'c';
      case SqueezeBindings.MID_HL: return 'hl';
      case SqueezeBindings.MID_OC: return 'oc';
      default: return undefined;
    }
  }

  createStrategy(data) {
    let link = `https://lexx-trade.com/strategy#t=s&s=${data.exchange}:${data.symbol}&tf=1m`;

    // binding
    link += `&bi=${this.getBindingForLink(data.binding)}`;
    // buy/sell trigger
    link += `&bt=${data.percentBuy}&st=${data.percentSell}`;
    // sl time
    if (data.stopLossTime) {
      link += `&slt=1&sltv=${data.stopLossTime}`;
    }
    // sl perc
    if (data.stopLossPercent) {
      link += `&sl=${data.stopLossPercent}`;
    }
    // Stop on closing one-min candle
    if (data.stopOnKlineClosed) {
      link += '&slc=1';
    }
    window.open(link, '_blank');
  }

  // - - -

  get locale(): string {
    return this.$i18n.locale === 'ru' ? ru : en;
  }

  clearForm(): void {
    this.downloadText = '';
    this.downloadTimeText = '';
    this.isShowTable = false;
    this.tableData = [];
    this.resultsCount = 0;

    this.calcForm = {
      exchange: EXCHANGE.BINANCE,
      fee: 0.075,
      symbol: 'BTCUSDT',
      timeframe: '1m',
      time: [],
      binding: {
        [SqueezeBindings.LOW]: true,
        [SqueezeBindings.HIGH]: false,
        [SqueezeBindings.OPEN]: false,
        [SqueezeBindings.CLOSE]: false,
        [SqueezeBindings.MID_HL]: false,
        [SqueezeBindings.MID_OC]: false,
      },
      percentBuyFrom: 1,
      percentBuyTo: 6,
      percentSellFrom: 0.5,
      percentSellTo: 3,
      stopLossTime: {
        isActive: true,
        from: 5,
        to: 60,
      },
      stopLossPercent: {
        isActive: false,
        from: 1,
        to: 10,
      },
      stopOnKlineClosed: true,
      minNumDeals: {
        isActive: false,
        value: 0,
      },
      minCoeff: {
        isActive: false,
        value: 0,
      },
      minWinRate: {
        isActive: false,
        value: 0,
      },
      maxSellBuyRatio: {
        isActive: false,
        value: 0.5,
      },
      algorithm: OptimizationAlgorithm.OMG,
      iterations: 100,
      saveResults: 20,
    };
    // @ts-ignore
    this.$refs.calcFormRef.resetFields();
  }
}
</script>

<style lang="scss">
@import "./sq-calc-form.scss";
</style>
