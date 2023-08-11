/**
 * Settings
 * @author Diego Lamarão <diego@invasaonerd.com.br>
 * @revision Andre Ferreira <andre@invasaonerd.com.br>
 */

module.exports = {
    parsePage: (page, settings) => {
        if (page.avatar)
            page.avatar = settings.url + "/image/" + page.url + "/avatar.jpg" + '?ts=' + page.feedbackDate;
            
        if (page.miniavatar)
            page.miniavatar = settings.url + "/image/" + page.url + "/miniavatar.jpg" + '?ts=' + page.feedbackDate;

        if (page.cover)
            page.cover = settings.url + "/image/" + page.url + "/cover.jpg" + '?ts=' + page.feedbackDate;

        return page
    }
}