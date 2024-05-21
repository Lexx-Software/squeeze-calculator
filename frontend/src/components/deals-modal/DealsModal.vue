<template>
    <el-dialog
        v-model="isVisible"
        width="80%"
        top="5vh"
        lock-scroll
        @open="handleOpenModal"
        @close="handleCloseModal"
    >
        <div class="deats-header-block">
            <span class="title">{{ $t('main.deals.title') }}</span>
            <span class="text">{{ dealsText }}</span>
            <el-radio-group class="radio" v-model="viewSelect" size="small">
                <el-radio-button label="table">{{ $t('main.deals.table') }}</el-radio-button>
                <el-radio-button label="chart">{{ $t('main.deals.chart') }}</el-radio-button>
            </el-radio-group>
        </div>
        
        <!-- CHART -->
        <ChartComponent
            ref="chartComponent"
            class="chart"
            :class="{ hide: viewSelect !== 'chart' }"
            :currentResult="currentResult"
            :item="dealsRow.item"
        />

        <!-- TABLE -->
        <el-table
            class="table"
            :class="{ hide: viewSelect !== 'table' }"
            :data="dealsRow.deals"
        >
            <el-table-column :label="$t('main.deals.timeEnter')">
                <template #default="scope">
                    {{ getDealTime(scope.row.timeEnter) }}
                </template>
            </el-table-column>

            <el-table-column :label="$t('main.deals.timeExit')">
                <template #default="scope">
                    {{ getDealTime(scope.row.timeExit) }}
                </template>
            </el-table-column>

            <el-table-column :label="$t('main.deals.priceEnter')">
                <template #default="scope">
                    {{ scope.row.priceEnter || '-' }}
                </template>
            </el-table-column>

            <el-table-column :label="$t('main.deals.priceExit')">
                <template #default="scope">
                    {{ scope.row.priceExit || '-' }}
                </template>
            </el-table-column>

            <el-table-column :label="$t('main.deals.profitPercent')">
                <template #default="scope">
                    <span :class="{ red: Number(scope.row.profitPercent) < 0 }">
                        {{ Number(scope.row.profitPercent).toFixed(2) }}%
                    </span>
                </template>
            </el-table-column>

            <el-table-column :label="$t('main.deals.stopLoss')">
                <template #default="scope">
                    {{ scope.row.isTimeStopLoss ? $t('main.deals.byTime') : (scope.row.isPercentStopLoss ? $t('main.deals.byPercent') : '-') }}
                </template>
            </el-table-column>

            <el-table-column :label="$t('main.table.maxDrawdownPercent')">
                <template #default="scope">
                    {{ scope.row.drawdownPercent ? `${scope.row.drawdownPercent.toFixed(2)}%` : '-' }}
                </template>
            </el-table-column>

            <el-table-column :label="$t('main.table.time')">
                <template #default="scope">
                    {{ ((scope.row.timeExit - scope.row.timeEnter) / 60000).toFixed(2) }}
                </template>
            </el-table-column>
        </el-table>
    </el-dialog>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { ICalculatedResult } from '../calculate';
import ChartComponent from './chart-component/ChartComponent.vue';
import { EXCHANGE_TEXT } from '../../enum';
import i18n from '@/i18n';

const { t } = i18n.global;

@Options({
    props: {
        value: Boolean,
        dealsRow: Object,
        currentResult: Object,
    },
    components: { ChartComponent }
})
export default class DealsModal extends Vue {
    declare value: boolean;
    declare dealsRow: any;
    declare currentResult: ICalculatedResult;
    declare $refs: any;

    dealsModalVisible = false;
    viewSelect = 'chart';

    get isVisible() {
        return this.value;
    }
    set isVisible(value) {
        this.$emit('input', value);
    }

    get dealsText() {
        return `
            ${t('main.symbol')}: ${EXCHANGE_TEXT[this.dealsRow.exchange]} ${this.dealsRow.symbol}, 
            ${t('main.table.percentEnter')}: ${this.dealsRow.percentEnter},
            ${t('main.table.percentExit')}: ${this.dealsRow.percentExit},
            ${t('main.binding')}: ${this.dealsRow.binding},
            ${t('main.timeframe')}: ${this.dealsRow.timeFrame},
            ${t('main.deals.stopLoss')}: ${this.dealsRow.stopLossPercent || '- '}% / ${this.dealsRow.stopLossTime}m, 
            ${t('main.deals.profitPercent')}: ${this.dealsRow.totalProfitPercent}%,
            ${t('main.table.coeff')}: ${this.dealsRow.coeff ? `${this.dealsRow.coeff}%` : '- '},
            ${t('main.table.winrate')}: ${this.dealsRow.winrate}.
        `;
    }

    getDealTime(value) {
        const date = new Date(value);
        const day = `0${date.getDate()}`.substr(-2);
        const month = `0${date.getMonth() + 1}`.substr(-2);
        const year = `0${date.getFullYear()}`.substr(-2);
        const hours = `0${date.getHours()}`.substr(-2);
        const minutes = `0${date.getMinutes()}`.substr(-2);
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    handleOpenModal() {
        this.$refs.chartComponent.initChart();
    }

    handleCloseModal() {
        this.viewSelect = 'chart';
        this.$refs.chartComponent.destroyChart();
    }
}
</script>
