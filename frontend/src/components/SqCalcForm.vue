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
                <el-select v-model="calcForm.exchange" @change="(e) => getSymbols(e)">
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

              <el-form-item class="right-item" :label="`${$t('main.fee')} %:`" prop="fee">
                <el-input class="short-input" v-model="calcForm.fee" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item :label="`${$t('main.symbol')}:`" prop="symbol">
                <!-- <el-input v-model="calcForm.symbol" /> -->

                <el-autocomplete
                  v-model="calcForm.symbol"
                  :fetch-suggestions="querySearchSymbol"
                  clearable
                />
              </el-form-item>

              <el-form-item class="right-item" :label="`${$t('main.direction')}:`" prop="direction">
                <el-select class="short-select" v-model="calcForm.isShort">
                    <el-option :label="'Long'" :value="false"/>
                    <el-option :label="'Short'" :value="true"/>
                </el-select>
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
                  :default-value="[new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)]"
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
              <el-form-item :label="`${$t('main.timeframe')}:`">
                <el-select v-model="calcForm.timeframe"  @change="onChangeTimeframe">
                    <el-option :label="'1m'" :value="'1m'"/>
                    <el-option :label="'3m'" :value="'3m'"/>
                    <el-option :label="'5m'" :value="'5m'"/>
                    <el-option :label="'15m'" :value="'15m'"/>
                    <el-option :label="'30m'" :value="'30m'"/>
                    <el-option :label="'1h'" :value="'1h'"/>
                    <el-option :label="'2h'" :value="'2h'"/>
                    <el-option :label="'4h'" :value="'4h'"/>
                    <el-option :label="'6h'" :value="'6h'"/>
                    <el-option :label="'8h'" :value="'8h'"/>
                    <el-option :label="'12h'" :value="'12h'"/>
                    <el-option :label="'1d'" :value="'1d'"/>
                </el-select>
              </el-form-item>

              <el-form-item class="right-item" label="">
                <el-checkbox
                  v-model="calcForm.oncePerCandle"
                  :label="$t('main.oncePerCandle')"
                />
              </el-form-item>
            </div>

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
              <el-form-item :label="`${$t('main.percentEnter')}:`" prop="percentEnterFrom">
                <el-input-number v-model="calcForm.percentEnterFrom" :precision="1" :step="0.1" :min="0.5" @change="ispercentEnterSellWasManuallySet = true" />
              </el-form-item>
              <span class="separator" />
              <el-form-item prop="percentEnterTo">
                <el-input-number v-model="calcForm.percentEnterTo" :precision="1" :step="0.1" :min="0.5" @change="ispercentEnterSellWasManuallySet = true" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item :label="`${$t('main.percentExit')}:`" prop="percentExitFrom">
                <el-input-number v-model="calcForm.percentExitFrom" :precision="1" :step="0.1" :min="0.5" @change="ispercentEnterSellWasManuallySet = true" />
              </el-form-item>
              <span class="separator" />
              <el-form-item prop="percentExitTo">
                <el-input-number v-model="calcForm.percentExitTo" :precision="1" :step="0.1" :min="0.5" @change="ispercentEnterSellWasManuallySet = true" />
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
                        :label="OptimizationAlgorithm.GRID"
                        :value="OptimizationAlgorithm.GRID"
                    />
                    <el-option
                        :label="OptimizationAlgorithm.OMG"
                        :value="OptimizationAlgorithm.OMG"
                    />
                    <el-option
                        label="Random"
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
                <span class="text">{{ totalNumberVariants }}</span>
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

            <div class="block">
              <el-form-item class="is-tooltip"  :label="`${$t('main.downloadTimeFrame')}:`" prop="downloadTimeFrame">
                <el-tooltip placement="bottom" effect="light">
                  <template #content>
                    <span v-html="$t('main.downloadTimeFrameTooltip')" />
                  </template>
                  <img class="icon" src="../assets/img/info.svg" alt="/">
                </el-tooltip>
                <el-select v-model="calcForm.downloadTimeFrame">
                    <el-option :label="'1m'" :value="'1m'"/>
                    <el-option :label="'3m'" :value="'3m'"/>
                    <el-option :label="'5m'" :value="'5m'"/>
                    <el-option :label="'15m'" :value="'15m'"/>
                    <el-option :label="'30m'" :value="'30m'"/>
                    <el-option :label="'1h'" :value="'1h'"/>
                    <el-option :label="'2h'" :value="'2h'"/>
                    <el-option :label="'4h'" :value="'4h'"/>
                </el-select>
              </el-form-item>
            </div>

            <!-- BUTTON -->
            <div class="btn-block">
              <el-button size="default" type="success" @click="submitForm" :disabled="loading">
                {{ $t('main.start') }}
              </el-button>
              <el-button
                size="default"
                @click="resetForm"
                :disabled="JSON.stringify(calcForm) === JSON.stringify(defaultFormData)"
              >
                {{ $t('main.reset') }}
              </el-button>
            </div>
          </div>
        </div>
      </el-form>
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
        {{ resultsText }}
      </span>
      <el-config-provider :locale="locale">
      <el-table
        class="table"
        :data="tableData"
        :default-sort="{ prop: 'totalProfitPercent', order: 'descending' }"
      >
        <el-table-column :label="$t('main.table.binding')" prop="binding" :sortable="true">
            <template #default="scope">
                {{ getBindingText(scope.row.binding) || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.percentEnter')" prop="percentEnter" :sortable="true">
            <template #default="scope">
                {{ scope.row.percentEnter || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.percentExit')" prop="percentExit" :sortable="true">
            <template #default="scope">
                {{ scope.row.percentExit || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.stopLossTime')" prop="stopLossTime" :sortable="true">
            <template #default="scope">
                {{ scope.row.stopLossTime || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.stopLossPercent')" prop="stopLossPercent" :sortable="true">
            <template #default="scope">
                {{ scope.row.stopLossPercent || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.totalDeals')" prop="totalDeals" :sortable="true">
            <template #default="scope">
                <el-button type="primary" link @click="openDealsModal(scope.row)">
                  {{ scope.row.totalDeals || '-' }} ({{ $t('main.table.info') }})
                </el-button>
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.totalProfitPercent')" prop="totalProfitPercent" :sortable="true">
            <template #default="scope">
                {{ scope.row.totalProfitPercent ? `${scope.row.totalProfitPercent}%` : '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.coeff')" prop="coeff" :sortable="true">
          <template #header>
              <span>
                {{ $t('main.table.coeff') }}
              </span>
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  <span v-html="$t('main.table.tooltip.testTest')" />
                </template>
                <img class="header-icon" src="../assets/img/info.svg" alt="/">
              </el-tooltip>
            </template>

            <template #default="scope">
                {{ scope.row.coeff || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.winrate')" prop="winrate" :sortable="true">
            <template #default="scope">
                {{ scope.row.winrate || '-' }}
            </template>
        </el-table-column>

        <el-table-column prop="maxDrawdownPercent" :sortable="true" :width="150">
            <template #header>
              <span>
                {{ $t('main.table.maxDrawdownPercent') }}
              </span>
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  <span v-html="$t('main.table.tooltip.maxDrawdownPercent')" />
                </template>
                <img class="header-icon" src="../assets/img/info.svg" alt="/">
              </el-tooltip>
            </template>

            <template #default="scope">
                {{ scope.row.maxDrawdownPercent ? `${scope.row.maxDrawdownPercent}%` : '-' }}
            </template>
        </el-table-column>

        <el-table-column prop="maxTimeInDealMins" :sortable="true" :width="130">
            <template #header>
              <span>
                {{ $t('main.table.maxTimeInDealMins') }}
              </span>
              <el-tooltip placement="bottom" effect="light">
                <template #content>
                  <span v-html="$t('main.table.tooltip.maxTimeInDealMins')" />
                </template>
                <img class="header-icon" src="../assets/img/info.svg" alt="/">
              </el-tooltip>
            </template>

            <template #default="scope">
                {{ scope.row.maxTimeInDealMins || '-' }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.action')" align="right" :width="80">
            <template #default="scope">
                {{ scope.row.action }}
                <el-button type="primary" link @click="createStrategyLink(scope.row)">
                    {{ $t('main.table.create') }}
                </el-button>
            </template>
        </el-table-column>
      </el-table>
      </el-config-provider>
    </div>

    <DealsModal v-model="isDealsModalVisible" :dealsRow="dealsRow" :currentResult="currentResult" />
  </div>
</template>

<script lang="ts">
import { Options, mixins } from 'vue-class-component';
import i18n from '@/i18n';
import type { FormRules, FormInstance } from 'element-plus';
import en from 'element-plus/dist/locale/en.mjs';
import ru from 'element-plus/dist/locale/ru.mjs';
import { EXCHANGE, EXCHANGE_TEXT, TIMEFRAME_PERC_SETTINGS } from '../enum';
import { calculateData, ICalculatedResult } from './calculate';
import DealsModal from './deals-modal/DealsModal.vue';
import BrowserLinks from './sq-calc-form-mixins/BrowserLinks';
import TableData from './sq-calc-form-mixins/TableData';
import {
  OptimizationAlgorithm,
  SqueezeBindings,
  BinanceExchange,
  TimeFrameSeconds,
  BestSqueezeFinder,
  ISqueezeOptimizationsParameters,
} from 'squeeze-utils';

const { t } = i18n.global;

@Options({
    components: { DealsModal },
})
export default class SqCalcForm extends mixins(BrowserLinks, TableData) {
  EXCHANGE = EXCHANGE;
  EXCHANGE_TEXT = EXCHANGE_TEXT;
  OptimizationAlgorithm = OptimizationAlgorithm;
  SqueezeBindings = SqueezeBindings;

  get locale(): string {
    return (this as any).$i18n.locale === 'ru' ? ru : en;
  }

  // FORM

  calcForm: any = {}
  defaultFormData = {
    isShort: false,
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
    percentEnterFrom: 1,
    percentEnterTo: 6,
    percentExitFrom: 0.5,
    percentExitTo: 3,
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
    oncePerCandle: false,
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
    algorithm: OptimizationAlgorithm.RANDOM,
    downloadTimeFrame: '1m',
    iterations: 1000,
    saveResults: 20,
  };
  currentResult: ICalculatedResult

  calcFormRules: FormRules = {
    symbol: [{ required: true, message: t('validation.inputValue'), trigger: ['blur', 'change'] }],
    fee: [{ required: true, message: t('validation.inputValue'), trigger: ['blur', 'change'] }],
    time: [{ required: true, message: t('validation.inputValue'), trigger: ['blur', 'change'] }],
    percentEnterFrom: [{ required: true, message: t('validation.inputValue'), trigger: ['blur', 'change'] }],
    percentEnterTo: [{
      validator: (rule, value, callback): void => {
        if (!value) {
            callback(new Error(t('validation.inputValue')));
        } else if (value < this.calcForm.percentEnterFrom) {
            callback(new Error(t('validation.lessThanPrev')));
        } else {
            callback();
        }
      },
      trigger: ['blur', 'change']
    }],
    percentExitFrom: [{ required: true, message: t('validation.inputValue'), trigger: ['blur', 'change'] }],
    percentExitTo: [{
      validator: (rule, value, callback): void => {
        if (!value) {
            callback(new Error(t('validation.inputValue')));
        } else if (value < this.calcForm.percentExitFrom) {
            callback(new Error(t('validation.lessThanPrev')));
        } else {
            callback();
        }
      },
      trigger: ['blur', 'change']
    }],
    downloadTimeFrame: [{
      validator: (rule, value, callback): void => {
        if (!value) {
            callback(new Error(t('validation.inputValue')));
        } else if (TimeFrameSeconds[value] > TimeFrameSeconds[this.calcForm.timeframe]) {
            callback(new Error(t('validation.moreThanSqueezeTimeframe')));
        } else {
            callback();
        }
      },
      trigger: ['blur', 'change'],
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
      this.downloadProgress = parseFloat(data.progress);
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
      this.resultsText = '';

      if (Object.values(this.calcForm.binding).every((value) => value === false)) {
        throw new Error(t('main.binding'))
      }

      // @ts-ignore
      await this.checkFormValid(this.$refs.calcFormRef);

      const result = await calculateData(this.calcForm, this.squeezeOptimizationsParameters, this.setDownloadText);

      this.setTableData(result);
      this.currentResult = result;

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

  get squeezeOptimizationsParameters() {
    const formData = this.calcForm;
    const binding = [];
    for (const key of Object.keys(formData.binding)) {
        if (formData.binding[key] === true) {
            binding.push(key);
        }
    }
    const settings: ISqueezeOptimizationsParameters = {
        isShort: formData.isShort,
        percentEnter: {
            from: formData.percentEnterFrom,
            to: formData.percentEnterTo,
        },
        percentExit: {
            from: formData.percentExitFrom,
            to: formData.percentExitTo,
        },
        timeFrame: formData.timeframe,
        oncePerCandle: formData.oncePerCandle,
        binding,
        algorithm: formData.algorithm,
        iterations: formData.iterations
    }
    if (formData.stopLossTime.isActive) {
        settings.stopLossTime = {
            from: formData.stopLossTime.from,
            to: formData.stopLossTime.to,
        }
    }
    if (formData.stopLossPercent.isActive) {
        settings.stopLossPercent = {
            from: formData.stopLossPercent.from,
            to: formData.stopLossPercent.to,
        }
    }
    if (formData.stopLossPercent.isActive) {
        settings.stopOnKlineClosed = formData.stopOnKlineClosed;
    }
    if (formData.minNumDeals.isActive || formData.minCoeff.isActive || formData.minWinRate.isActive || formData.maxSellBuyRatio.isActive) {
        settings.filters = {};
        if (formData.minNumDeals.isActive) {
            settings.filters.minNumDeals = formData.minNumDeals.value;
        }
        if (formData.minCoeff.isActive) {
            settings.filters.minCoeff = formData.minCoeff.value;
        }
        if (formData.minWinRate.isActive) {
            settings.filters.minWinRate = formData.minWinRate.value;
        }
        if (formData.maxSellBuyRatio.isActive) {
            settings.filters.maxSellBuyRatio = formData.maxSellBuyRatio.value;
        }
    }
    return settings;
  }

  // Total possible variants

  get totalNumberVariants() {
    const result = BestSqueezeFinder.totalNumberVariants(this.squeezeOptimizationsParameters)
    return result && result > 0 ? `${t('main.max')}: ${result}` : '';
  }

  // Set buy sell percent from fimeframe

  ispercentEnterSellWasManuallySet = false;

  onChangeTimeframe() {
    if (this.ispercentEnterSellWasManuallySet) {
      return;
    }
    const data = TIMEFRAME_PERC_SETTINGS[this.calcForm.timeframe];
    this.calcForm.percentEnterFrom = data.buy.from;
    this.calcForm.percentEnterTo = data.buy.to;
    this.calcForm.percentExitFrom = data.sell.from;
    this.calcForm.percentExitTo = data.sell.to;
  }

  // Search symbol

  symbolsList = [];

  async getSymbols(exchange) {
    this.calcForm.fee = exchange === EXCHANGE.BINANCE ? 0.075 : 0.02;
    
    const exchangeData = new BinanceExchange(exchange);
    const tickers = await exchangeData.getSymbolsTickers();
    const result = [];
    for (const key of Object.keys(tickers)) {
      result.push({ value: key });
    }
    this.symbolsList = result;
  }

  querySearchSymbol(queryString, cb) {
    const symbols = this.symbolsList;
    const results = queryString ? symbols.filter(this.createFilter(this.calcForm.symbol)) : symbols;
    cb(results);
  }

  createFilter(queryString) {
    return (symbol) => symbol.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0;
  }

  // RESET FORM

  resetForm(): void {
    this.downloadText = '';
    this.downloadTimeText = '';
    this.isShowTable = false;
    this.tableData = [];
    this.resultsCount = 0;
    this.resultsText = '';
    this.ispercentEnterSellWasManuallySet = false;

    this.calcForm = JSON.parse(JSON.stringify(this.defaultFormData))
    // @ts-ignore
    this.$refs.calcFormRef.resetFields();
  }

  // - - -

  created() {
    this.calcForm = JSON.parse(JSON.stringify(this.defaultFormData))
    this.getSymbols(this.calcForm.exchange)
    this.checkLink();
  }
}
</script>
