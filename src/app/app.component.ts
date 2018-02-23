import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'app';
  inputForm: FormGroup;
  canvas: HTMLCanvasElement;
  bldgArea: number;

  constructor(private fb: FormBuilder) { // <--- inject FormBuilder
    this.createForm();
  }

  static degreesToRadians(degrees: number) {
    return degrees * Math.PI / 180;
  }

  createForm() {
    this.inputForm = this.fb.group({
      units: 'ft',
      lotWidth: [33, [Validators.required, Validators.pattern('[0-9]+[.]?[0-9]*$')]], // <--- the FormControl called "lotWidth"
      lotDepth: [122, [Validators.required, Validators.pattern('[0-9]+[.]?[0-9]*$')]],
      frontYardPercent: 20,
      sideYardPercent: 10,
      backYardPercent: 45
    });
  }

  ngOnInit(): void {

    this.canvas = document.getElementById('setbackCanvas') as HTMLCanvasElement;
    this.inputForm.valueChanges.subscribe(val => {
      if (this.inputForm.valid) {
        this.drawCanvas();
      }
    });

    this.drawCanvas();
  }

  drawCanvas(): void {
    console.log(`canvas height:${this.canvas.height} width:${this.canvas.width}`);

    const frontYardPercent = this.inputForm.get('frontYardPercent').value;
    const sideYardPercent = this.inputForm.get('sideYardPercent').value;
    const backYardPercent = this.inputForm.get('backYardPercent').value;

    const BuildingColour = 'rgb(0, 82, 110)';
    const YardColour = 'rgba(0, 0, 0, 0.03)';

    const lotDepth: number = this.inputForm.get('lotDepth').value;
    const lotWidth: number = this.inputForm.get('lotWidth').value;

    let ctx = this.canvas.getContext('2d');
    ctx.save();

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let ctxPerspectiveCanvasHeight, ctxPerspectiveCanvasWidth;

    if (lotWidth > lotDepth) { // front yard = top of canvas
      ctxPerspectiveCanvasHeight = this.canvas.height;
      ctxPerspectiveCanvasWidth = this.canvas.width;
    } else { // front yard = left of canvas
      // move context to bottom left and rotate
      ctx.translate(0, this.canvas.height);
      // rotate 90 degrees counter-clockwise
      ctx.rotate(AppComponent.degreesToRadians(-90));

      // change size
      ctxPerspectiveCanvasHeight = this.canvas.width;
      ctxPerspectiveCanvasWidth = this.canvas.height;
    }

    let lotDrawDepth = this.realUnitToCanvasUnit(lotDepth, ctxPerspectiveCanvasHeight);
    let lotDrawWidth = this.realUnitToCanvasUnit(lotWidth, ctxPerspectiveCanvasHeight);

    if (lotDrawWidth > ctxPerspectiveCanvasWidth) {
      const scalingFactor = ctxPerspectiveCanvasWidth / lotDrawWidth;
      lotDrawDepth *= scalingFactor;
      lotDrawWidth *= scalingFactor;
    }

    let centrePoint = (width: number) => width / 2;
    let calculateBldgDepth = (lotDepth: number) => lotDepth * (100 - frontYardPercent - backYardPercent) / 100;
    let calculateBldgWidth = (lotWidth: number) => lotWidth * (100 - 2 * sideYardPercent) / 100;

    let xOffsetToDrawRectInCentre = centrePoint(ctxPerspectiveCanvasWidth) - centrePoint(lotDrawWidth);
    ctx.translate(xOffsetToDrawRectInCentre, 0);

    ctx.strokeRect(0, 0, lotDrawWidth, lotDrawDepth);

    ctx.fillStyle = YardColour;
    ctx.fillRect(1, 1, lotDrawWidth - 2, lotDrawDepth - 2);

    if ( frontYardPercent + backYardPercent < 100 && sideYardPercent < 50) {
      let bldgDrawDepth = calculateBldgDepth(lotDrawDepth);
      let bldgDrawWidth = calculateBldgWidth(lotDrawWidth);

      let frontYardDrawDepth = lotDrawDepth * frontYardPercent / 100;
      let sideyardDrawDepth = lotDrawWidth * sideYardPercent / 100;

      ctx.fillStyle = BuildingColour;
      ctx.fillRect(sideyardDrawDepth,
                   frontYardDrawDepth,
                   bldgDrawWidth,
                   bldgDrawDepth);
      this.bldgArea = calculateBldgDepth(lotDepth) * calculateBldgWidth(lotWidth);
    } else {
      this.bldgArea = 0;
    }

    // clean up
    ctx.restore();
  }

  realUnitToCanvasUnit(xCoordInRealUnits: number, currContextCanvasHeight: number): number {
    return xCoordInRealUnits / this.inputForm.get('lotDepth').value * currContextCanvasHeight;
  }

  toCanvasUnits(numRealUnits: number, maxRealUnits: number, currContextCanvasHeight: number): number {
    return numRealUnits / maxRealUnits * currContextCanvasHeight;
  }
}
