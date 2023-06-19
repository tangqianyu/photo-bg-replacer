/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/member-ordering */
import { Component, ElementRef, OnInit, ViewChild, AfterViewChecked, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Observer } from 'rxjs';
// import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { ElectronService } from '../core/services';
import { arrayBufferToJson } from '../shared/utils/common';
import {RAPID_API_KEY, REMOVE_BG_API_KEY} from '../app.setting';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewChecked {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private canvas!: HTMLCanvasElement;
  private context!: CanvasRenderingContext2D;

  current = 0;
  avatarUrl!: string;
  imageUrl!: string;
  imageBuffer!: ArrayBuffer | null;
  file: File | null = null;
  loading = false;
  downloadLoading = false;
  imageLoading = false;
  color: string = '#F00';
  currentService: 'removebg' | 'rapidapi' = 'removebg';
  serviceLsit = [
    {
      label: 'Remove.bg',
      value: 'removebg'
    },
    {
      label: 'Rapid API',
      value: 'rapidapi'
    }
  ];

  basicColors = ['#F00', '#FFF', '#438EDB'];

  constructor(
    private router: Router,
    private http: HttpClient,
    private msg: NzMessageService,
    private electronService: ElectronService,
    private zone: NgZone
  ) {}

  ngOnInit(): void {}

  ngAfterViewChecked() {
    if (this.canvasRef) {
      this.canvas = this.canvasRef.nativeElement;
      this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    }
  }

  beforeUpload = (file: any): boolean => {
    this.file = file;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.getBase64(file!, img => {
      this.avatarUrl = img;
    });
    return false;
  };

  private getBase64(img: File, callback: (img: string) => void): void {
    const reader = new FileReader();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    reader.addEventListener('load', () => callback(reader.result!.toString()));
    reader.readAsDataURL(img);
  }

  private getBlob(arrayBuffer: ArrayBuffer) {
    const uint8Array = new Uint8Array(arrayBuffer);
    const blob = new Blob([uint8Array], { type: 'image/jpeg' });
    return blob;
  }

  next() {
    if (this.current === 1) {
      if (this.currentService === 'removebg') {
        this.fetchRemoveBgApi();
      } else if (this.currentService === 'rapidapi') {
        this.fetchRapidAPI();
      }

      return;
    }
    this.current++;
  }

  pre() {
    this.current--;
  }

  fetchRemoveBgApi() {
    this.loading = true;
    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('bg_color', this.color);
    formData.append('image_file', this.file as Blob);
    this.http
      .post('https://api.remove.bg/v1.0/removebg', formData, {
        headers: {
          'X-Api-Key': REMOVE_BG_API_KEY
        },
        responseType: 'arraybuffer'
      })
      .subscribe(
        res => {
          this.loading = false;
          this.imageBuffer = res;
          this.imageUrl = URL.createObjectURL(this.getBlob(res));
          this.current++;
        },
        error => {
          this.loading = false;
          this.msg.error(arrayBufferToJson(error.error).errors[0].title);
        }
      );
  }

  fetchRapidAPI() {
    this.loading = true;
    const formData = new FormData();
    formData.append('image_base64', this.avatarUrl.split(',')[1]);
    formData.append('color_removal', 'transparent');
    this.http
      .post('https://background-removal.p.rapidapi.com/remove', formData, {
        headers: {
          'X-RapidAPI-Key': RAPID_API_KEY,
          'X-RapidAPI-Host': 'background-removal.p.rapidapi.com'
        }
      })
      .subscribe(
        (res: any) => {
          this.loading = false;
          this.current++;
          this.imageLoading = true;
          const img = new Image();
          img.onload = () => {
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            this.context.fillStyle = this.color; // 设置背景色，这里设为红色，你可以根据需要修改
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.drawImage(img, 0, 0);
            this.imageUrl = this.canvas.toDataURL();
            this.canvas.toBlob(blob => {
              const reader = new FileReader();
              reader.onloadend = () => {
                this.imageBuffer = reader.result as ArrayBuffer;
              };
              reader.readAsArrayBuffer(blob as Blob);
            });
          };

          this.electronService.convertImageUrlToArrayBuffer(res.response.image_url, arraybuffer => {
            img.src = URL.createObjectURL(this.getBlob(arraybuffer));

            this.zone.run(() => {
              this.imageLoading = false;
            });
          });
        },
        error => {
          console.log(error);
          this.loading = false;
        }
      );
  }

  handleClickColorBlock(value: string) {
    this.color = value;
  }

  downloadImage() {
    this.downloadLoading = true;
    this.electronService.downloadImage(this.imageBuffer as ArrayBuffer, () => {
      this.downloadLoading = false;
    });
    return;
  }

  reset() {
    this.current = 0;
    this.avatarUrl = '';
    this.imageUrl = '';
    this.imageBuffer = null;
    this.file = null;
    this.color = '#F00';
    this.currentService = 'removebg';
  }
}
