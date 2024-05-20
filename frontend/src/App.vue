<template>
  <div class="single-page wrp">
    <!-- header -->
    <div class="header">
      <div class="logo-block">
        <img class="logo" alt="/" src="./assets/img/sc-logo.svg" />
      </div>
      <div class="settings-block">
        <a class="link" href="https://lexx-trade.com" target="_blank">
          {{ $t('header.openPlatform') }}
        </a>
        <el-dropdown class="dropdown" trigger="click" @command="handleCommandLang">
          <span>
            {{ $i18n.locale.toUpperCase() }}
            <span class="arrow-symbol">⌄</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="locale in $i18n.availableLocales"
                :key="`locale-${locale}`"
                :command="locale"
              >
                {{ locale.toUpperCase() }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- cont -->
    <SqCalcForm />

    <!-- footer -->
    <div class="footer">
      <span class="text" v-html="$t('footer.text')" />
      <span class="copyright">
        {{ $t('footer.copyright', { year: new Date().getFullYear() }) }}
      </span>
    </div>
  </div>
  
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import SqCalcForm from './components/SqCalcForm.vue';
import { initAnalytics } from './analytics';

@Options({
  components: {
    SqCalcForm,
  },
})
export default class App extends Vue {
  handleCommandLang(command: string): void {
    this.$i18n.locale = command;
  }
  created() {
    initAnalytics('G-CYHPBRLHZF');
  }
}
</script>

<style lang="scss">
@import "./assets/style/index.scss";
</style>
