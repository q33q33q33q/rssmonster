<template>
  <div id="app">
    <div class="row">
      <div class="sidebar col-md-3 col-sm-0">
        <app-sidebar @modal="modalClick"></app-sidebar>
      </div>
      <div class="home col-md-9 offset-md-3 col-sm-12">
        <app-quickbar @mobile="mobileClick"></app-quickbar>
        <app-toolbar class="toolbar"></app-toolbar>
          <p class="offline" v-show="offlineStatus">Application is currently offline!</p>
        <app-home></app-home>
      </div>
    </div>
    <!-- Modal -->
    <app-modal @modal="modalClick" :modal="modal" :input-category="category" :input-feed="feed"></app-modal>
    <!-- Mobile Pop-up -->
    <app-mobile :mobile="mobile" @mobile="mobileClick" @modal="modalClick"></app-mobile>
  </div>
</template>

<style>
/* Landscape phones and portrait tablets */
@media (max-width: 766px) {
  div.sidebar,
  div.toolbar {
    display: none;
  }

  div.col-md-9 {
    padding-right: 0px;
  }

  div.quickbar {
    position: fixed;
    z-index: 9999;
  }
}

/* Desktop */
@media (min-width: 766px) {
  div.quickbar {
    display: none;
  }

  div.sidebar {
    height: 100%;
    background-color: #31344b;
    overflow-y: auto;
    overflow-x: hidden;
  }

  @media (prefers-color-scheme: dark) {
    div.sidebar {
      background-color: #2c2c2c;
    }
  }
}

div.row {
  margin-right: 0px;
}

div.sidebar {
  position: fixed;
}

p.offline {
  margin-top: 50px;
  text-align: center;
}

html, #app {
  background-color: #f9f9f9;
}

@media (prefers-color-scheme: dark) {
  html, #app {
    background-color: #121212;
  }

  div.home {
    background: black;
  }

  img {
    filter: brightness(.8) contrast(1.2);
  }

  body svg.icon path {
    fill: #efefef;
  }

  a:visited, a:active, a:link {
    color: #18bc9c;
  }
}
</style>

<script>
import store from "./store";

//import idb-keyval
import { get, set } from 'idb-keyval';

import Home from "./components/Home.vue";
const Sidebar = () => import(/* webpackChunkName: "sidebar" */ "./components/Sidebar.vue");
const Toolbar = () => import(/* webpackChunkName: "toolbar" */ "./components/Toolbar.vue");
const Quickbar = () => import(/* webpackChunkName: "quickbar" */ "./components/Quickbar.vue");
const Modal = () => import(/* webpackChunkName: "modal" */ "./components/Modal.vue");
const Mobile = () => import(/* webpackChunkName: "mobile" */ "./components/Mobile.vue");

export default {
  components: {
    appSidebar: Sidebar,
    appHome: Home,
    appToolbar: Toolbar,
    appQuickbar: Quickbar,
    appModal: Modal,
    appMobile: Mobile
  },
  data() {
    return {
      category: {},
      feed: {},
      modal: false,
      mobile: null,
      store: store,
      notificationStatus: null,
      offlineStatus: false
    };
  },
  created: function() {
    //fetch all category and feed information for an complete overview including total read and unread counts
    this.getOverview(true);

    //Trigger PWA notification support
    if ('Notification' in window && 'serviceWorker' in navigator && 'indexedDB' in window) {

      get('notificationStatus').then((val) => {
        if (val === undefined) {
          //notificationStatus isn't set, thus ask for permissions to install WPA
          Notification.requestPermission(result => {
            if (result !== 'granted') {
              set('notificationStatus', false);
              this.notificationStatus = false;
            } else {
              set('notificationStatus', true);
              this.notificationStatus = true;
            }
          })
        } else {
          //update local data
          this.notificationStatus = val;
        }
      });

      //save reference to 'this', while it's still this!
      var self = this;

      //background update overview every fifteen minutes
      setInterval(function() {
        self.getOverview(false);
      }, 900 * 1000);

    }

    //default body background color to black for dark mode.
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      //This addresses bounce background glitch for devices running safari: https://www.tempertemper.net/blog/scroll-bounce-page-background-colour
      document.body.style.background="#000000";
      document.querySelector('meta[name="theme-color"]').setAttribute('content',  '#000000');
    }
    //default body background color to blue for light mode.
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      document.querySelector('meta[name="theme-color"]').setAttribute('content',  '#31344b');
    }
    //add metadata properties to document
    document.title = "RSSMonster";
    document.head.querySelector("meta[name=viewport]").content = "width=device-width, initial-scale=1";
    document.head.querySelector("meta[http-equiv=X-UA-Compatible]").content = "IE=edge";
  },
  methods: {
    closeModal: function() {
      this.error_msg = "";
      this.store.showModal = false;
    },
    modalClick: function(value) {
      this.store.showModal = value;
      if (value == "newfeed") {
        this.feed = {};
      }
      if (value == "newcategory") {
        this.category = {};
      }
      if (value == "renamefeed") {
        this.feed = this.lookupFeedById(
          parseInt(this.store.currentSelection.feedId)
        );
      }
      if (value == "renamecategory") {
        this.category = this.lookupCategoryById(
          parseInt(this.store.currentSelection.categoryId)
        );
      }
    },
    mobileClick: function(value) {
      this.mobile = value;
    },
    lookupFeedById: function(feedId) {
      for (var x = 0; x < this.store.categories.length; x++) {
        for (var i = 0; i < this.store.categories[x].feeds.length; i++) {
          if (this.store.categories[x].feeds[i].id === feedId) {
            return this.store.categories[x].feeds[i];
          }
        }
      }
    },
    lookupCategoryById: function(categoryId) {
      for (var x = 0; x < this.store.categories.length; x++) {
        if (this.store.categories[x].id === categoryId) {
          return this.store.categories[x];
        }
      }
    },
    updateSelection: function(data) {
      //only update the local values of some categories exist
      if (this.store.categories.length) {
        //set the feed to empty when the store changes, e.g. change can be that only a category is selected
        this.feed = {};

        //lookup category name based on the categoryId received
        if (data.categoryId) {
          var category = this.store.categories.filter(function(a) {
            return a.id == data.categoryId;
          })[0];
          this.category = category;
        }
        //lookup feed name based on the feedId
        if (data.feedId) {
          this.feed = this.lookupFeedById(data.feedId);
        }
      }
    },
    getOverview: function(initial) {
      //get an overview with the count for all feeds
      this.$http
        .get("api/manager/overview")
        .then(response => {
          return response.json();
        })
        .then(data => {
          //set offlineStatus to false
          this.offlineStatus = false;

          //update the store counts
          var previousUnreadCount = this.store.unreadCount;
          this.store.unreadCount = data.unreadCount;
          this.store.readCount = data.readCount;
          this.store.starCount = data.starCount;
          this.store.hotCount = data.hotCount;

          //set PWA badge using unread count
          if ('Notification' in window && 'serviceWorker' in navigator && 'indexedDB' in window) {
            navigator.setAppBadge(data.unreadCount);
          }

          //update the categories in the store
          this.store.categories = data.categories;

          //update local category and feed based on current selection
          if (initial === true) {
            this.updateSelection(this.store.currentSelection);  
          } else {
            //only show notifcation when new messages have arrived (previousUnreadCount is larger than current unreadCount)
            if (previousUnreadCount < data.unreadCount) {
              this.showNotification(data.unreadCount - previousUnreadCount);
            }
          }
        })
        .catch(error => {
          console.error("There was an error!", error);
          this.offlineStatus = true;
        });
    },
    showNotification(input) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready // returns a Promise, the active SW registration
          .then(swreg => swreg.showNotification('New articles', {
            body: input + ' new articles arrived',
            icon: '/img/icons/android-icon-192x192.png',
            vibrate: [300, 200, 300]
        }))
      }
    }
  },
  //watch the store.currentSelection, set local data (category, feed) based on current selection
  watch: {
    "store.currentSelection": {
      handler: function(data) {
        this.updateSelection(data);
      },
      deep: true
    },
    "store.currentSelection.categoryId": {
      handler: function() {
        this.feed = {};
      }
    },
    "store.currentSelection.feedId": {
      handler: function() {
        this.closeModal();
      }
    },
    "store.currentSelection.filter": {
      handler: function() {
        this.closeModal();
      }
    },
    "store.currentSelection.status": {
      handler: function() {
        this.closeModal();
      }
    },
    "store.unreadCount": {
      handler: function(count) {
        //set PWA badge count
        if ('serviceWorker' in navigator) {
          navigator.setAppBadge(count);
        }
      }
    }
  }
};
</script>
