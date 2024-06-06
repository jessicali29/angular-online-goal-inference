import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SocketService } from '../socket.service';
import { fromEvent } from 'rxjs';
import { filter, map, pluck, scan, withLatestFrom } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trial',
  templateUrl: './trial.component.html',
  styleUrls: ['./trial.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class TrialComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('button', { static: true }) button!: ElementRef<HTMLButtonElement>;

  ctx!: CanvasRenderingContext2D;
  gridNumber = 10;
  cellSize!: number;
  currentPlayerPosition = { x: 0, y: 0 };
  goals: any[] = [];
  blocks: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    // Initialization logic here
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.cellSize = this.canvas.nativeElement.width / this.gridNumber;

    this.drawMap();

    fromEvent(this.button.nativeElement, 'click').subscribe(() => {
      this.socketService.emit('playerReady');
    });

    this.action_position$.subscribe(newPosition => {
      this.currentPlayerPosition = newPosition.position;
      this.render(newPosition.position);
    });

    this.socketService.connect();

    this.socketService.on('connect').subscribe(() => {
      console.log('Connected to server');
      this.socketService.emit('playerReady');
    });

    this.socketService.on('initializeGame').subscribe((game_map: any) => {
      console.log(game_map);
      this.goals = game_map.goals.map((goal: any) => ({
        x: goal[0], y: goal[1], color: this.getDefaultColor(), opacity: 1
      }));
      this.blocks = game_map.blocks.map((block: any) => ({
        x: block[0], y: block[1]
      }));
      this.currentPlayerPosition = { x: 0, y: 0 }; // Reset to the starting position
      this.render(this.currentPlayerPosition);
    });

    this.socketService.on('disconnect').subscribe(() => {
      console.log('Disconnected from server');
    });

    this.socketService.on('updatePosterior').subscribe((posterior: any) => {
      console.log('Posterior:', posterior);
      this.goals[0].color = `rgb(${Math.floor(posterior.G1 * 255)}, 0, 0)`;
      this.goals[1].color = `rgb(${Math.floor(posterior.G2 * 255)}, 0, 0)`;
      this.goals[2].color = `rgb(${Math.floor(posterior.G3 * 255)}, 0, 0)`;
      this.render(this.currentPlayerPosition); // Redraw the canvas with the current player position
    });
  }

  drawMap() {
    for (let i = 0; i < this.gridNumber * this.gridNumber; i++) {
      const x = (i % this.gridNumber) * this.cellSize;
      const y = Math.floor(i / this.gridNumber) * this.cellSize;
      this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
    }
  }

  drawBlocks(blocks: any[]) {
    blocks.forEach(block => {
      this.ctx.fillStyle = 'brown';
      this.ctx.globalAlpha = 1;
      this.ctx.fillRect(block.x * this.cellSize, block.y * this.cellSize, this.cellSize, this.cellSize);
    });
  }

  getDefaultColor() {
    const red = 50;
    const green = 10;
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
  }

  drawPlayer(playerPosition: any) {
    this.ctx.beginPath();
    this.ctx.fillStyle = 'blue';
    this.ctx.arc(playerPosition.x * this.cellSize + (this.cellSize / 2), playerPosition.y * this.cellSize + (this.cellSize / 2), this.cellSize / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawGoals(goals: any[]) {
    goals.forEach(goal => {
      this.ctx.fillStyle = goal.color;
      this.ctx.globalAlpha = 1;
      this.ctx.fillRect(goal.x * this.cellSize, goal.y * this.cellSize, this.cellSize, this.cellSize);
    });
    this.ctx.globalAlpha = 1;
  }

  isReached(playerPosition: any, goals: any[]) {
    return goals.some(goal => goal.x === playerPosition.x && goal.y === playerPosition.y);
  }

  clearMap() {
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.drawMap();
  }

  render(playerPosition: any) {
    this.clearMap();
    this.drawPlayer(playerPosition);
    this.drawGoals(this.goals);
    this.drawBlocks(this.blocks);
  }

  get action_position$() {
    return fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      pluck('code'),
      filter((code: string) => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)),
      map(code => {
        switch (code) {
          case 'ArrowLeft': return { x: -1, y: 0 };
          case 'ArrowRight': return { x: 1, y: 0 };
          case 'ArrowUp': return { x: 0, y: -1 };
          case 'ArrowDown': return { x: 0, y: 1 };
          default: return { x: 0, y: 0 };
        }
      }),
      scan((playerPosition, movement) => {
        let newPosition = {
          x: Math.max(0, Math.min(this.gridNumber - 1, playerPosition.x + movement.x)),
          y: Math.max(0, Math.min(this.gridNumber - 1, playerPosition.y + movement.y))
        };
        let isCollision = this.blocks.some(block => block.x === newPosition.x && block.y === newPosition.y);
        if (isCollision) {
          newPosition = playerPosition;
        }
        return newPosition;
      }, this.currentPlayerPosition),
      map(newPosition => ({ action: [newPosition.x, newPosition.y], position: newPosition }))
    );
  }
}
