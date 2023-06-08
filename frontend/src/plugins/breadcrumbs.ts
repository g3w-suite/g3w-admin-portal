import { useDataStore } from '@/stores';
import { App, reactive } from 'vue'
import { RouteLocationNormalized, Router } from 'vue-router';

/**
 * Reusable Vue Breadcrumb component
 *
 * @see https://github.com/Merkushin-AY/vue-3-breadcrumbs/
 *
 * @requires vue-router
 */
export const breadcrumbs = {
  install: (app: App) => {
    // Init breadcrumbs
    app.config.globalProperties.$breadcrumbs = new Breadcrumbs(app).init()

    // Component import
    // if (options?.includeComponent) {
    //     const AmBreadcrumbs = defineAsyncComponent(() => import('./AmBreadcrumbs.vue'))
    //     app.component('AmBreadcrumbs', AmBreadcrumbs)
    // }

  }
};

class Breadcrumbs {

  #app: App
  
  #router: Router

  value: Array<Crumb | string> // breadcrumbs array

  constructor(app: App) {
    this.#app = app
    this.#router = app.config.globalProperties.$router
    this.value = reactive([])
  }

  init() {
    this.#router.afterEach((route, from, failure) => {
      if (failure || (route.path === from.path && from.matched.length)) return false
      this.setBreadcrumbsByRoute(route)
    });
    return this;
  }

  /**
   * Creates and sets breadcrumbs chain for route
   */
  setBreadcrumbsByRoute(route: RouteLocationNormalized) {
    if (!route) return false;
    let arPath = route.path.replace(/\/$/, "").split('/');
    let iterablePath = '';
    let spliced = false;

    const title: string[] = [];

    arPath.forEach((item, i) => {
      // 1. Get path for crumb
      iterablePath += (i === 1) ? item : '/' + item
      let isCurrentCrumb = i + 1 >= arPath.length;

      // 2. Check if this crumb already exist, delete excess crumbs
      if (this.value[i]?._path === iterablePath) {
        // if this is last crumb delete excess existing crumbs
        if (isCurrentCrumb) this.value.splice(i + 1, this.value.length)
        this.value[i].current = i + 1 >= arPath.length
        return false
      } else if (!spliced && i < this.value.length) {
        this.value.splice(i, this.value.length)
        spliced = true
      }

      // 3. Create and add crumb
      const breadcrumb = this.createBreadcrumb(iterablePath, isCurrentCrumb)

      if (!breadcrumb) return false;

      this.value.push(breadcrumb);
    });

    const current = this.value[this.value.length-1];

    title.push(current.title ?? current);
    title.push(useDataStore().info.title || 'G3W-SUITE')

    window.document.title = title.join(' - ');
  }

  /**
   * Resolves route meta by path and creates breadcrumb object 
   */
  createBreadcrumb(path: string, isCurrent = false): Crumb | string | false {
    if (!path) return false
    let route = this.#router.resolve(path)
    let crumb: Crumb = route.meta?.breadcrumb as any
    if ('function' === typeof crumb) crumb = crumb.call(null, route, this.#app)

    return crumb ? {
      label: crumb?.label ?? crumb,
      title: crumb?.title ?? crumb?.label ?? crumb,
      link: ('object' === typeof crumb && crumb.link) ? crumb.link : route.path,
      current: isCurrent,
      _path: path
    } : false;
  }

}

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $breadcrumbs: Breadcrumbs;
  }
}

interface Crumb {
  label: string;
  link: string;
  title: string;
  current: boolean;
  _path: string;
}