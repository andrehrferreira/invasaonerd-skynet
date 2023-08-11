({
  page: {},
  modal: false,
  editMode: false,
  adding: false,
  editingType: '',
  buttonState: true,
  swiperOption: {
    slidesPerView: "auto",
    spaceBetween: 10,
    loop: false,
    pagination: {
      el: '.swiper-pagination',
      clickable: true
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    }
  },
  movieDetails: '',
  movieModal: false,
  seasonDetails: '',
  seasonModal: false,
  bookDetails: '',
  bookModal: false,
  movingBox: false,
  pageLoading: {
    active: false,
    icon: '',
    text: 'Carregando...'
  }
})
