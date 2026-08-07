import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;

// 2. 強制指定使用 cdnjs 的靜態圖標資源
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-locations',
  imports: [],
  templateUrl: './locations.component.html',
  styleUrl: './locations.component.scss',
})
export class LocationsComponent implements AfterViewInit {

  map!: L.Map;

  disasterList = [
    {
      name: '米克拉颱風災區',
      lat: 22.923307,
      lng: 120.571986,
      type: '需要志工'
    },
    {
      name: '花蓮淹水災區',
      lat: 23.671356,
      lng: 121.434886,
      type: '需要志工'
    },
  ];

  donationList = [

  {
    name:'台北市',
    lat:25.0330,
    lng:121.5654

  },

  {
    name:'高雄市',
    lat:22.6273,
    lng:120.3014
  },

  {
    name:'嘉義市',
    lat:23.4801,
    lng:120.4491
  }

];
  ngAfterViewInit() {

    this.map = L.map('map')
      .setView([23.7, 120.9], 7);
setTimeout(() => {
    this.map.invalidateSize();
  }, 500);

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: 'OpenStreetMap'
      }
    ).addTo(this.map);


    this.disasterList.forEach(item => {

      L.marker([item.lat, item.lng])
        .addTo(this.map)
        .bindPopup(`
          <h3>${item.name}</h3>
          <p>${item.type}</p>
        `);

    });

  }


  moveMap(item:any){

    this.map.setView(
      [item.lat, item.lng],
      13
    );

  }

  selectLocation(event:any){

  const name = event.target.value;


  const location = this.disasterList.find(
    item => item.name === name
  );


  if(location){

    this.map.setView(
      [location.lat, location.lng],
      13
    );

  }
}
selectDonation(event:any){

  const name = event.target.value;


  const donation = this.donationList.find(
    item => item.name === name
  );

 if(donation){

    this.map.setView(
      [donation.lat, donation.lng],
      13
    );


    L.marker([
      donation.lat,
      donation.lng
    ])
    .addTo(this.map)
    .bindPopup(donation.name)
    .openPopup();

  }

}
}

