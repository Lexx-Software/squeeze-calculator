<template>
  <div class="single-page wrp">
    <!-- header -->
    <div class="header">
      <div class="logo-block">
        <img alt="/" src="./assets/img/logo.svg" />
        <span class="title">{{ $t('header.title') }}</span>
      </div>
      <div class="settings-block">
        <el-dropdown class="header__dropdown-lang" trigger="click" @command="handleCommandLang">
          <span class="header__dropdown-btn">
            {{ $i18n.locale.toUpperCase() }}
            <el-icon class="header__dropdown-icon"><arrow-down /></el-icon>
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

@Options({
  components: {
    SqCalcForm,
  },
})
export default class App extends Vue {
  handleCommandLang(command: string): void {
    this.$i18n.locale = command;
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
