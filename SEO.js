/**
 * Settings
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 * @revision Andre Ferreira <andre@invasaonerd.com.br>
 */

module.exports = {
    breadCrumbs: {
        community: (settings, url, title) => {
            return {
                "@context": "http://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [{
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": settings.url + "/"
                },{
                    "@type": "ListItem",
                    "position": 2,
                    "name": title,
                    "item":  settings.url + "/page/" + url
                },{
                    "@type": "ListItem",
                    "position": 3,
                    "name": "Comunidade",
                    "item":  settings.url + "/page/" + url + "/community?p=1"
                }]
            }
        },
        answers: (settings, url, title, topicTitle, topicId) => {
            return {
                "@context": "http://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [{
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": settings.url + "/"
                },{
                    "@type": "ListItem",
                    "position": 2,
                    "name": title,
                    "item":  settings.url + "/page/" + url
                },{
                    "@type": "ListItem",
                    "position": 3,
                    "name": "Comunidade",
                    "item":  settings.url + "/page/" + url + "/community?p=1"
                },{
                    "@type": "ListItem",
                    "position": 4,
                    "name": topicTitle,
                    "item":  settings.url + "/page/" + url + "/community/" + topicId + "?p=1"
                }]
            }
        }
    }
}