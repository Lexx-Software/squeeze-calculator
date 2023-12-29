<template>
  <div class="single-page wrp">
    <!-- header -->
    <div class="header">
      <div class="logo-block">
        <img alt="/" src="./assets/img/logo.svg" />
        <span class="title">{{ $t('header.title') }}</span>
      </div>
      <div class="settings-block">
        <el-dropdown trigger="click" @command="handleCommandLang">
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
    initAnalytics();
  }
}
</script>

<style lang="scss">
@import "./assets/style/app.scss";

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 60px;
  .title {
    font-size: 14px;
    margin-left: 12px;
    color: $grey;
  }
  .arrow-symbol {
    position: relative;
    bottom: 4px;
    font-size: 12px;
  }
}

.footer {
  padding: 6px 0;
  text-align: center;
  .copyright {
    font-size: 12px;
    color: $grey;
  }
}
</style>
