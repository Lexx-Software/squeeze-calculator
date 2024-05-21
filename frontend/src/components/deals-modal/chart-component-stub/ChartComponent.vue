<template>
    <div class="no-chart-block">Charting library is not integrated</div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

@Options({
    props: {
        currentResult: Object,
        item: Object,
    },
})
export default class DealsModal extends Vue {
    mounted() {
    }

    unmounted() {
    }
}
</script>

<style>
.no-chart-block {
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
