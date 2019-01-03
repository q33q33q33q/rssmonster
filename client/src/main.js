import Vue from 'vue';
import VueResource from 'vue-resource';
import App from './App.vue';

//import css
import './assets/css/bootstrap.min.css';

//add vueresourrce in order to make API calls
Vue.use(VueResource);

// only import the icons you use to reduce bundle size
import 'vue-awesome/icons/circle';
import 'vue-awesome/icons/folder';
import 'vue-awesome/icons/plus';
import 'vue-awesome/icons/trash';
import 'vue-awesome/icons/pen';
import 'vue-awesome/icons/sync';
import 'vue-awesome/icons/spinner';
import 'vue-awesome/icons/heart';
import 'vue-awesome/icons/star';

import Icon from 'vue-awesome/components/Icon';

// globally (in your main .js file)
Vue.component('v-icon', Icon)

import config from './config.js';

Vue.http.options.root = config.API_URL_ROOT;

//central state with stash
import VueStash from 'vue-stash';
Vue.use(VueStash);

new Vue({
	el: '#app',
	data: {
		store: {
			data: {
				filter: 'full',
				status: 'unread',
				category: null,
				feed: null,
				search: null,
				refresh: 0
			},
			modal: false,
			refreshCategories: 0,
			categories: [],
			unreadCount: 0,
			readCount: 0,
			starCount: 0
		},
		baseUrl: null
	},
	render: h => h(App)
});

// Comment these three for local build.
Vue.config.devtools = true;
Vue.config.debug = true;
Vue.config.silent = true;