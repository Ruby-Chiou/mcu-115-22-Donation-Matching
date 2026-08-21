import { Component } from '@angular/core';
  import { FormsModule } from '@angular/forms';


  // 物資需求的資料格式
  interface MaterialNeed {
    item: string;
    quantity: number;
    unit: string;
  }
  interface Disaster {
  id: number;
  name: string;
}


  @Component({
    selector: 'app-admin-disaster-control',
    imports: [FormsModule],
    templateUrl: './admin-disaster-control.component.html',
    styleUrl: './admin-disaster-control.component.scss'
  })
  export class AdminDisasterControlComponent {

  isDisasterOpen = false;
  constructor() {
    const savedStatus = localStorage.getItem('disasterOpen');
    this.isDisasterOpen = savedStatus === 'true';
  }
  openDisaster() {
     this.isDisasterOpen = true;
    localStorage.setItem(
      'disasterOpen',
      'true'
    );
  }
  closeDisaster() {
    // 讀取之前儲存的狀態
    this.isDisasterOpen = false;
    localStorage.setItem(
      'disasterOpen',
      'false'
    );
  }
    // 災害名稱
    disasterName = '';
    // 災害說明
    disasterDescription = '';
    // 是否正在編輯災害資訊
    isEditing = false;
    // 開始編輯
    startEditing() {
      this.isEditing = true;
    }
    // 儲存災害資訊
    saveDisaster() {
      this.isEditing = false;
    }
    disasterImage: string | null = null;


    // 選擇圖片
    onImageSelected(event: Event) {
      const input = event.target as HTMLInputElement;


      if (!input.files || input.files.length === 0) {
        return;
      }
      const file = input.files[0];


      if (!file.type.startsWith('image/')) {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.disasterImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
    // 目前的物資需求清單


    materialNeeds: MaterialNeed[] = [];
    // 是否顯示新增物資表單
    isAddingMaterial = false;
    // 新增物資時暫存的資料


    newMaterial = {
      item: '',
      quantity: 0,
      unit: '箱'
    };
  // 開啟新增物資表單
    startAddingMaterial() {
      this.isAddingMaterial = true;
    }




    // 儲存新增的物資
    saveMaterial() {
      // 沒有輸入物資名稱就不儲存
      if (!this.newMaterial.item.trim()) {
        return;
      }
      // 數量必須大於 0
      if (this.newMaterial.quantity <= 0) {
        return;
      }
      // 加入物資清單
      this.materialNeeds.push({
        item: this.newMaterial.item,
        quantity: this.newMaterial.quantity,
        unit: this.newMaterial.unit
      });
      // 清空輸入內容
      this.newMaterial = {
        item: '',
        quantity: 0,
        unit: '箱'
      };
      // 關閉新增表單
      this.isAddingMaterial = false;
    }
    // 刪除物資
    deleteMaterial(index: number) {
      this.materialNeeds.splice(index, 1);
    }
  }
