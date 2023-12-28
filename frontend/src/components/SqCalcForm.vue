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

              <el-form-item class="fee-item"  :label="`${$t('main.fee')} %:`">
                <el-input class="short-input" v-model="calcForm.fee" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item :label="`${$t('main.symbol')}:`" prop="symbol">
                <el-input v-model="calcForm.symbol" />
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
              <el-form-item :label="`${$t('main.percentBuy')}:`">
                <el-input-number v-model="calcForm.percentBuy.from" :precision="1" :step="0.1" :min="0.5" />
              </el-form-item>
              <span class="separator" />
              <el-form-item>
                <el-input-number v-model="calcForm.percentBuy.to" :precision="1" :step="0.1" :min="0.5" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item :label="`${$t('main.percentSell')}:`">
                <el-input-number v-model="calcForm.percentSell.from" :precision="1" :step="0.1" :min="0.5" />
              </el-form-item>
              <span class="separator" />
              <el-form-item>
                <el-input-number v-model="calcForm.percentSell.to" :precision="1" :step="0.1" :min="0.5" />
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
                <el-checkbox v-model="calcForm.stopOnKlineClosed" :label="$t('main.stopOnKlineClosed')" />
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
                <el-input-number v-model="calcForm.minNumDeals.value" :min="0" :disabled="!calcForm.minNumDeals.isActive" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item class="is-active-checkbox">
                <el-checkbox v-model="calcForm.minCoeff.isActive" />
              </el-form-item>

              <el-form-item :label="`${$t('main.minCoeff')}:`">
                <el-input-number v-model="calcForm.minCoeff.value" :min="0" :disabled="!calcForm.minCoeff.isActive" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item class="is-active-checkbox">
                <el-checkbox v-model="calcForm.minWinRate.isActive" />
              </el-form-item>

              <el-form-item :label="`${$t('main.minWinRate')}:`">
                <el-input-number v-model="calcForm.minWinRate.value" :min="0" :disabled="!calcForm.minWinRate.isActive" />
              </el-form-item>
            </div>
          </div>

          <!-- OPTIMIZATION -->
          <div class="level">
            <span class="title">
              {{ $t('main.optimizationSettings') }}
            </span>

            <div class="block">
              <el-form-item :label="`${$t('main.algorithm')}:`">
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
              <el-form-item :label="`${$t('main.iterations')}:`">
                <el-input-number v-model="calcForm.iterations" :min="0" />
              </el-form-item>
            </div>

            <div class="block">
              <el-form-item :label="`${$t('main.saveResult')}:`">
                <el-input-number v-model="calcForm.saveResult" :min="0" />
              </el-form-item>
            </div>
          </div>
        </div>
      </el-form>

      <!-- BUTTON -->
      <div class="btn-block">
        <el-button type="success" @click="submitForm">{{ $t('main.start') }}</el-button>
        <el-button @click="clearForm">{{ $t('main.reset') }}</el-button>
      </div>
    </el-config-provider>

    <!-- PROGRESS -->
    <div class="download-block">
      <div class="text-block">
        <span v-if="downloadText" class="item" v-html="downloadText" />
        <br>
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
    <span v-if="isNoTableData" class="no-data-text">
      {{ $t('main.noTableData') }}
    </span>
    <div v-if="tableData" class="table-block">
      <span class="title">
        {{ $t('main.results') }}:
      </span>
      <el-table class="table" :data="tableData">
        <el-table-column :label="$t('main.table.binding')">
            <template #default="scope">
                {{ scope.row.binding }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.percentBuy')">
            <template #default="scope">
                {{ scope.row.percentBuy }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.percentSell')">
            <template #default="scope">
                {{ scope.row.percentSell }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.timeout')">
            <template #default="scope">
                {{ scope.row.timeout }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.stopLossPercent')">
            <template #default="scope">
                {{ scope.row.stopLossPercent }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.totalDeals')">
            <template #default="scope">
                {{ scope.row.totalDeals }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.totalProfitPercent')">
            <template #default="scope">
                {{ scope.row.totalProfitPercent }}%
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.coeff')">
            <template #default="scope">
                {{ scope.row.coeff }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.winrate')">
            <template #default="scope">
                {{ scope.row.winrate }}
            </template>
        </el-table-column>

        <el-table-column :label="$t('main.table.action')">
            <template #default="scope">
                {{ scope.row.action }}
            </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component';
import type { FormRules, FormInstance } from 'element-plus';
import en from 'element-plus/dist/locale/en.mjs';
import ru from 'element-plus/dist/locale/ru.mjs';
import { EXCHANGE, EXCHANGE_TEXT } from '../enum';
import { OptimizationAlgorithm } from '../../../src/bestSqueezeFinder';
import { SqueezeBindings } from '../../../src/squeezeCalculator';
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
    time: [],
    binding: {
      [SqueezeBindings.LOW]: true,
      [SqueezeBindings.HIGH]: false,
      [SqueezeBindings.OPEN]: false,
      [SqueezeBindings.CLOSE]: false,
      [SqueezeBindings.MID_HL]: false,
      [SqueezeBindings.MID_OC]: false,
    },
    percentBuy: {
      from: 0.5,
      to: 5,
    },
    percentSell: {
      from: 0.5,
      to: 5,
    },
    stopLossTime: {
      isActive: true,
      from: 5,
      to: 60,
    },
    stopLossPercent: {
      isActive: false,
      from: 0,
      to: 0,
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
    algorithm: OptimizationAlgorithm.OMG,
    iterations: 100,
    saveResult: 20,
  };

  calcFormRules: FormRules = {
    symbol: [{ required: true, message: t('validation.inputValue'), trigger: ['blur', 'change'] }],
    time: [{ required: true, message: t('validation.inputValue'), trigger: ['blur', 'change'] }],
  }

  downloadText = '';
  downloadTimeText = '';
  downloadProgress = 0;

  setDownloadText(data) {
    if (data.startDownload) {
      this.downloadText = 'Start download';
    }
    if (data.downloadTime) {
      this.downloadTimeText += `Download in ${data.downloadTime} seconds. `;
    }
    if (data.startCalculate) {
      this.downloadText = 'Start calculate';
    }
    if (data.calculateTime) {
      this.downloadTimeText += `Calculate in ${data.calculateTime} seconds. `;
    }
    if (data.progress) {
      this.downloadProgress = data.progress;
    }
  }

  async submitForm(): Promise<void> {
    try {
      // @ts-ignore
      await this.checkFormValid(this.$refs.calcFormRef);

      const result = await calculateData(this.calcForm, this.setDownloadText);

      this.setTableData(result);

      console.log('Result:', result);
      console.log('Result:\n%s', JSON.stringify(result, null, 2));
    } catch (err) {
      (this as any).$message({
          type: 'error',
          message: err,
          showClose: true,
          duration: 20000
      });
    } finally {
      this.downloadText = '';
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

  tableData = undefined;
  isNoTableData = false

  setTableData(data) {
    this.tableData = undefined
    if (!data) {
      this.isNoTableData = true;
      return
    }
    this.tableData = [{
      binding: data.settings.binding || '-',
      percentBuy: data.settings.percentBuy || '-',
      percentSell: data.settings.percentSell || '-',
      timeout: '-',
      stopLossPercent: data.settings.stopLossPercent || '-',
      totalDeals: data.totalDeals || '-',
      totalProfitPercent: data.totalProfitPercent ? data.totalProfitPercent.toFixed(2) : '-',
      coeff: data.coeff ? data.coeff.toFixed(2) : '-',
      winrate: data.winRate ? data.winRate.toFixed(2) : '-',
      action: '-',
    }];
  }

  // - - -

  get locale(): string {
    return this.$i18n.locale === 'ru' ? ru : en;
  }

  clearForm(): void {
    this.downloadText = '';
    this.downloadTimeText = '';
    this.tableData = undefined;

    this.calcForm = {
      exchange: EXCHANGE.BINANCE,
      fee: 0.075,
      symbol: 'BTCUSDT',
      time: [],
      binding: {
        [SqueezeBindings.LOW]: true,
        [SqueezeBindings.HIGH]: false,
        [SqueezeBindings.OPEN]: false,
        [SqueezeBindings.CLOSE]: false,
        [SqueezeBindings.MID_HL]: false,
        [SqueezeBindings.MID_OC]: false,
      },
      percentBuy: {
        from: 0.5,
        to: 5,
      },
      percentSell: {
        from: 0.5,
        to: 5,
      },
      stopLossTime: {
        isActive: true,
        from: 5,
        to: 60,
      },
      stopLossPercent: {
        isActive: false,
        from: 0,
        to: 0,
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
      algorithm: OptimizationAlgorithm.OMG,
      iterations: 100,
      saveResult: 20,
    };
    // @ts-ignore
    this.$refs.calcFormRef.resetFields();
  }
}
</script>

<style lang="scss">
@import "./sq-calc-form.scss";
</style>