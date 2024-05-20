<template>
    <div ref="chartContainer" />
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
