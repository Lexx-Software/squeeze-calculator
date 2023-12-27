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

            <el-form-item :label="`${$t('main.fee')} %:`">
              <el-input v-model="calcForm.fee" />
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
                type="daterange"
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
              <el-checkbox v-model="calcForm.binding.low" :label="$t('main.low')" />
              <el-checkbox v-model="calcForm.binding.high" :label="$t('main.high')" />
              <el-checkbox v-model="calcForm.binding.open" :label="$t('main.open')" />
              <el-checkbox v-model="calcForm.binding.close" :label="$t('main.close')" />
              <el-checkbox v-model="calcForm.binding.midOC" :label="$t('main.midOC')" />
              <el-checkbox v-model="calcForm.binding.midHL" :label="$t('main.midHL')" />
            </el-form-item>
          </div>

          <div class="block">
            <el-form-item :label="`${$t('main.percentBuy')}:`">
              <el-input-number v-model="calcForm.percentBuy.from" :min="0" />
            </el-form-item>
            <span class="separator" />
            <el-form-item>
              <el-input-number v-model="calcForm.percentBuy.to" :min="0" />
            </el-form-item>
          </div>

          <div class="block">
            <el-form-item :label="`${$t('main.percentSell')}:`">
              <el-input-number v-model="calcForm.percentSell.from" :min="0" />
            </el-form-item>
            <span class="separator" />
            <el-form-item>
              <el-input-number v-model="calcForm.percentSell.to" :min="0" />
            </el-form-item>
          </div>

          <div class="block">
            <el-form-item class="is-active-checkbox">
              <el-checkbox v-model="calcForm.timeoutStoploss.isActive" />
            </el-form-item>

            <el-form-item :label="`${$t('main.timeoutStoploss')}:`">
              <el-input-number v-model="calcForm.timeoutStoploss.from" :min="0" :disabled="!calcForm.timeoutStoploss.isActive" />
            </el-form-item>
            <span class="separator" />
            <el-form-item>
              <el-input-number v-model="calcForm.timeoutStoploss.to" :min="0" :disabled="!calcForm.timeoutStoploss.isActive" />
            </el-form-item>
          </div>

          <div class="block">
            <el-form-item class="is-active-checkbox">
              <el-checkbox v-model="calcForm.priceStoploss.isActive" />
            </el-form-item>

            <el-form-item :label="`${$t('main.priceStoploss')}:`">
              <el-input-number v-model="calcForm.priceStoploss.from" :min="0" :disabled="!calcForm.priceStoploss.isActive" />
            </el-form-item>
            <span class="separator" />
            <el-form-item prop="timeoutStoplossTo">
              <el-input-number v-model="calcForm.priceStoploss.to" :min="0" :disabled="!calcForm.priceStoploss.isActive" />
            </el-form-item>
          </div>

          <div class="block">
            <el-form-item label=" ">
              <el-checkbox v-model="calcForm.stopOnClosing" :label="$t('main.stopOnClosing')" />
            </el-form-item>
          </div>
        </div>

        <!-- FILTERS -->
        <div class="level">
          <span class="title">
            {{ $t('main.filters') }}
          </span>

          <div class="block">
            <el-form-item class="is-active-checkbox">
              <el-checkbox v-model="calcForm.minNumberDeals.isActive" />
            </el-form-item>

            <el-form-item :label="`${$t('main.minNumberDeals')}:`">
              <el-input-number v-model="calcForm.minNumberDeals.value" :min="0" :disabled="!calcForm.minNumberDeals.isActive" />
            </el-form-item>
          </div>

          <div class="block">
            <el-form-item class="is-active-checkbox">
              <el-checkbox v-model="calcForm.minProfCoef.isActive" />
            </el-form-item>

            <el-form-item :label="`${$t('main.minProfCoef')}:`">
              <el-input-number v-model="calcForm.minProfCoef.value" :min="0" :disabled="!calcForm.minProfCoef.isActive" />
            </el-form-item>
          </div>

          <div class="block">
            <el-form-item class="is-active-checkbox">
              <el-checkbox v-model="calcForm.minWinrate.isActive" />
            </el-form-item>

            <el-form-item :label="`${$t('main.minWinrate')}:`">
              <el-input-number v-model="calcForm.minWinrate.value" :min="0" :disabled="!calcForm.minWinrate.isActive" />
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

        <!-- BUTTON -->
        <div class="btn-block">
          <el-button type="success" @click="submitForm">{{ $t('main.start') }}</el-button>
          <el-button @click="clearForm">{{ $t('main.reset') }}</el-button>
        </div>
      </el-form>
    </el-config-provider>
  </div>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component';
import type { FormRules, FormInstance } from 'element-plus';
import en from 'element-plus/dist/locale/en.mjs';
import ru from 'element-plus/dist/locale/ru.mjs';
import { EXCHANGE, EXCHANGE_TEXT } from '../enum';
import { OptimizationAlgorithm } from '../../../src/bestSqueezeFinder';
import { calculateData } from './calculate';
import i18n from '@/i18n';

const { t } = i18n.global;

export default class SqCalcForm extends Vue {
  EXCHANGE = EXCHANGE;
  EXCHANGE_TEXT = EXCHANGE_TEXT;
  OptimizationAlgorithm = OptimizationAlgorithm

  calcForm = {
    exchange: EXCHANGE.BINANCE,
    fee: 0.075,
    symbol: 'BTCUSDT',
    time: '',
    binding: {
      low: true,
      high: false,
      open: false,
      close: false,
      midOC: false,
      midHL: false,
    },
    percentBuy: {
      from: 0.5,
      to: 5,
    },
    percentSell: {
      from: 0.5,
      to: 5,
    },
    timeoutStoploss: {
      isActive: true,
      from: 5,
      to: 60,
    },
    priceStoploss: {
      isActive: false,
      from: 0,
      to: 0,
    },
    stopOnClosing: true,
    minNumberDeals: {
      isActive: false,
      value: 0,
    },
    minProfCoef: {
      isActive: false,
      value: 0,
    },
    minWinrate: {
      isActive: false,
      value: 0,
    },
    algorithm: OptimizationAlgorithm.OMG,
    iterations: 0,
    saveResult: 0,
  };

  calcFormRules: FormRules = {
    symbol: [{ required: true, message: t('validation.inputValue'), trigger: ['blur', 'change'] }],
    time: [{ required: true, message: t('validation.inputValue'), trigger: ['blur', 'change'] }],
  }

  async submitForm(): Promise<void> {
    try {
        // @ts-ignore
        // await this.checkFormValid(this.$refs.calcFormRef); // @@@

        calculateData(this.calcForm);
    } catch (err) {
        console.log('Error on submit form', err);
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

  get locale(): string {
    return this.$i18n.locale === 'ru' ? ru : en;
  }

  clearForm(): void {
    this.calcForm = {
      exchange: EXCHANGE.BINANCE,
      fee: 0.075,
      symbol: 'BTCUSDT',
      time: '',
      binding: {
        low: true,
        high: false,
        open: false,
        close: false,
        midOC: false,
        midHL: false,
      },
      percentBuy: {
        from: 0.5,
        to: 5,
      },
      percentSell: {
        from: 0.5,
        to: 5,
      },
      timeoutStoploss: {
        isActive: true,
        from: 5,
        to: 60,
      },
      priceStoploss: {
        isActive: false,
        from: 0,
        to: 0,
      },
      stopOnClosing: true,
      minNumberDeals: {
        isActive: false,
        value: 0,
      },
      minProfCoef: {
        isActive: false,
        value: 0,
      },
      minWinrate: {
        isActive: false,
        value: 0,
      },
      algorithm: OptimizationAlgorithm.OMG,
      iterations: 0,
      saveResult: 0,
    };
    // @ts-ignore
    this.$refs.calcFormRef.resetFields();
  }
}
</script>

<style lang="scss">
@import "./sq-calc-form.scss";
</style>
