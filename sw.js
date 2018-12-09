//code implemented following Lab: Caching Files with Service Worker from developers.google.com

importScripts('/js/idb.js');
importScripts('/js/reviewsStore.js');
importScripts('/js/dbhelper.js');

var filesToCache = [
  '/css/styles.css',
  '/index.html',
  "pages/offline.html",
  "style/main.css"

];

var staticCacheName = 'static-cache-v1';

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(staticCacheName)
    .then(function (cache) {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      if (response) return response;

      return fetch(event.request).then(function (response) {
        return caches.open(staticCacheName).then(function (cache) {
          cache.put(event.request.url, response.clone());
          return response;
        })
      })
    }).catch(error => {
      //console.log("Error, ", error);
      return caches.match("pages/offline.html");
    })
  );
});

self.addEventListener('activate', function (event) {
  var cacheWhitelist = [staticCacheName];

  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('sync', function (event) {
  if (event.tag === 'penginRevs') {
    event.waitUntil(
      reviewsStore.revsidb('readonly').then(function (revsidb) {
        return revsidb.getAll();
      }).then(revs => {
        if (!revs) {
          console.log('no hay datos');
          return;
        }
        DBHelper.treatPendingRevs(revs);
      }).then(() => {
        console.log('sync ok');
      }).catch(function (err) {
        console.error(err);
      })
    );
  }
});