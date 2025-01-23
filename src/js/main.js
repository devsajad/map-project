// Import Leaflet library
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Import assets
import curLocIcon from "../assets/current.svg";
import curLocOflineIcon from "../assets/currentOfline.svg";
import resIcon from "../assets/resturant.svg";
const catIcones = {
  restaurants: resIcon,
};
// Select Elements
const getLoacationEl = document.querySelector(".getLocation-icon-container");
const inputTitle = document.querySelector("#title");

const formEl = document.querySelector(".sidebar__main--form-container");
const iconAddEl = document.querySelector(".add-container");
const sideBareListEl = document.querySelector(".sidebar__main--list-container");
const markIconEl = document.querySelector(".sidebar__nav__icon-container");

const titleInput = document.getElementById("title");
const categoriesSelect = document.getElementById("categories");
const descriptionTextarea = document.getElementById("description");

class App {
  #map;
  #mapZoomLevel = 15;
  #currentPosition;
  #currentPosMarker = null;
  #mapEv;
  #places = [];

  constructor() {
    this.#loadMap();
    this.#addTileLayer();
    getLoacationEl.addEventListener("click", this.#getPosition.bind(this));
    formEl.addEventListener("submit", this.#newPlace.bind(this));
    markIconEl.addEventListener("click", this.#toggleSidebarList.bind(this));
    sideBareListEl.addEventListener("click", this.#moveToPopup.bind(this));

    this.#getLocalStorage();
  }

  #loadMap() {
    const savedLocation = JSON.parse(localStorage.getItem("currentLocation"));

    this.#map = L.map("map").setView(
      [
        savedLocation?.latitude ? savedLocation.latitude : 35.7219,
        savedLocation?.longitude ? savedLocation.longitude : 51.3347,
      ],
      this.#mapZoomLevel,
      {
        animate: true,
      }
    );
    // Configure Icones
    const defaultIcon = L.icon({
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
    L.Marker.prototype.options.icon = defaultIcon;

    if (savedLocation)
      this.#showCurLocMarker(
        savedLocation?.latitude,
        savedLocation?.longitude,
        false
      );

    this.#map.on("click", this.#showForm.bind(this));
  }

  #addTileLayer() {
    L.tileLayer(
      "https://tile.jawg.io/jawg-streets/{z}/{x}/{y}{r}.png?access-token={accessToken}",
      {
        attribution: "",
        minZoom: 0,
        maxZoom: 22,
        accessToken:
          "xUYdIoKcs1WnLyRxVk54tUoy81cFrz9ASUZMLyxVA9vubtuuju0CdgkaDYUzw3Dk",
      }
    ).addTo(this.#map);
  }

  #getPosition() {
    function getPositionError(err) {
      alert("We could not get your position");
      console.warn(`ERROR(${err.code}): ${err.message}`);
    }
    // AFTER : Show loading
    if (!navigator.geolocation) {
      return alert("Geolocation is not supported by this browser.'");
    }
    navigator.geolocation.getCurrentPosition(
      this.#loadCurrentPosition.bind(this),
      getPositionError
    );
  }

  #loadCurrentPosition(position) {
    // Remove previous marker
    if (this.#currentPosMarker) {
      this.#map.removeLayer(this.#currentPosMarker);
    }

    const { latitude, longitude } = position.coords;
    this.#map.setView([latitude, longitude], this.#mapZoomLevel);
    this.#showCurLocMarker(latitude, longitude, true);

    // Save the current location to localStorage
    localStorage.setItem(
      "currentLocation",
      JSON.stringify({ latitude, longitude })
    );
    this.#currentPosition = { latitude, longitude };
  }

  #showCurLocMarker(latitude, longitude, isLocationOn) {
    this.#currentPosMarker = L.marker([latitude, longitude], {
      icon: L.icon({
        iconUrl: isLocationOn ? curLocIcon : curLocOflineIcon,
        iconSize: [50, 50],
      }),
    })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          className: `cur-location `,
        })
      )
      .setPopupContent(
        isLocationOn ? `You are here 🏠` : `You are usually here.📍`
      )
      .openPopup();
  }

  #showForm(event) {
    this.#mapEv = event;
    formEl.classList.remove("hidden");
    iconAddEl.classList.remove("hidden");
    inputTitle.focus();
  }

  // Add new place when user submit form
  #newPlace(e) {
    e.preventDefault();
    // get input data
    const titleValue = titleInput.value;
    const categoryValue = categoriesSelect.value;
    const descriptionValue = descriptionTextarea.value;

    // AFTER : Inpute validation
    //

    // get clicked location for submit place
    const { lat, lng } = this.#mapEv.latlng;

    // craete new place object
    const place = new Place(
      [lat, lng],
      titleValue,
      categoryValue,
      descriptionValue
    );
    console.log(place);
    // Push place to the places array
    this.#places.push(place);

    // Render marker of place on map
    this.#renderPlaceMarker(place);

    this.#hideForm();

    // Render place on sidbar list
    this.#renderPlaceSidebar(place);

    // Save to local storage
    this.#savePlaceToLocal();
  }

  // When form submit render clicked location marker
  #renderPlaceMarker(place) {
    this.#currentPosMarker = L.marker(place.coords, {
      icon: L.icon({
        iconUrl: catIcones[place.category],
        iconSize: [40, 40],
      }),
    })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          autoClose: false,
          closeOnClick: false,
          className: `places places__${place.category}`,
        })
      )
      .setPopupContent(place.title)
      .openPopup();
  }

  #hideForm() {
    titleInput.value = categoriesSelect.value = descriptionTextarea.value = "";
    formEl.classList.add("hidden");
    iconAddEl.classList.add("hidden");
  }

  #renderPlaceSidebar(place) {
    const el = `<li class="sidebar__main--list" data-id="${place.id}">
          <div class="sidebar__main--text-container">
            <p class="title">${place.title}</p>
          </div>
          <div class="sidebar__main--text-container">
            <p class="time">${place.category}</p>
          </div>
          <div class="sidebar__main--icon">
            <div class="pencil-icon">
              <i class="ph ph-pencil-simple"></i>
            </div>

            <div class="trash-icon">
              <i class="ph ph-trash"></i>
            </div>
          </div>
        </li>`;
    sideBareListEl.insertAdjacentHTML("afterbegin", el);
  }

  #toggleSidebarList() {
    sideBareListEl.classList.toggle("hidden");
  }

  #savePlaceToLocal() {
    localStorage.setItem("places", JSON.stringify(this.#places));
  }

  #getLocalStorage() {
    const places = JSON.parse(localStorage.getItem("places"));

    if (!places) return;
    this.#places = places;
    places.forEach((element) => {
      this.#renderPlaceSidebar(element);
      this.#renderPlaceMarker(element);
    });
  }

  #moveToPopup(e) {
    const target = e.target.closest(".sidebar__main--list");
    if (!target) return;

    const id = target.dataset.id;
    const targetPlace = this.#places.find((el) => el.id === id);

    if (!targetPlace) return;
    this.#setView(targetPlace.coords);
  }

  #setView(coords) {
    this.#map.setView(coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 0.5,
      },
    });
  }
}

class Place {
  id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  constructor(coords, title, category, desctiption) {
    this.title = title;
    this.category = category;
    this.desctiption = desctiption;
    this.coords = coords;
  }
}

const app = new App();
