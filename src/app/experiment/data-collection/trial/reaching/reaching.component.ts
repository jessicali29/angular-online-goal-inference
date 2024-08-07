import { Component, ElementRef, Input, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { fromEvent } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { map, filter, pluck, scan, withLatestFrom } from 'rxjs/operators';
import { GameService } from '../services/game.service'; // Adjust the path
@Component({
  selector: 'app-reaching',
  templateUrl: './reaching.component.html',
  styleUrls: ['./reaching.component.css']
})
export class ReachingComponent implements OnInit {
  @ViewChild('gameCanvas', { static: true }) gameCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('clickMe', { static: true }) clickMe!: ElementRef<HTMLButtonElement>;
  @Input() trialNumber: number = 0;
  @Output() reachingFinished = new EventEmitter<void>();

  private ctx!: CanvasRenderingContext2D;
  private gridNumber = 10;
  private cellSize!: number;
  private playerStartingPosition = { x: 0, y: 0 };
  private currentPlayerPosition = this.playerStartingPosition;
  private socket!: Socket;
  private goals: any[] = [];
  private blocks: any[] = [];
  private policy: any;

  constructor(private gameService: GameService) {}

  // figure out whether this gets called every trial or just once 
  // figure out when things get destroyed 
  // socket connection should not get destroyed
  // reorganize the directory, move things that we don't want to destroy into another component 
  // figure out whatever is trial-specific, and then recycle things
  // prioritize figuring out carry-over effects 
  // solve things step by step, get rid of socket first
  // place things outside ngOnInit (especially socket)
  // ngOnChange, ngOnExit, and some other functions, see how these functions work in terms of life cycle 
  // use break points 
  // everything is in the ngOnInit, which might cause carry-over effect

  ngOnInit() {
    const canvasElement = this.gameCanvas.nativeElement;
    this.ctx = canvasElement.getContext('2d')!;
    this.cellSize = canvasElement.width / this.gridNumber;
    this.socket = io('http://localhost:3000');

    fromEvent(this.clickMe.nativeElement, 'click').subscribe(() => {
      this.socket.emit('playerReady', 'Player is ready!');
    });

    this.socket.on('initializeGame', (game_map: any) => {
      this.initializeGame(game_map);
    });

    this.socket.on('updatePosterior', (posterior: any) => {
      this.updateGoalColors(posterior);
      this.render(this.currentPlayerPosition);
    });

    const movement$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      pluck('code'),
      filter((code: string) => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)),
      map((code: string) => {
        switch (code) {
          case 'ArrowLeft': return { x: -1, y: 0 };
          case 'ArrowRight': return { x: 1, y: 0 };
          case 'ArrowUp': return { x: 0, y: -1 };
          case 'ArrowDown': return { x: 0, y: 1 };
          default: return { x: 0, y: 0 };
        }
      })
    );

    const updatePlayerPos$ = movement$.pipe(
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
      }, this.playerStartingPosition)
    );

    const action_position$ = movement$.pipe(
      withLatestFrom(updatePlayerPos$),
      map(([action, newPosition]) => ({
        action: { x: action.x, y: action.y },
        position: newPosition
      }))
    );

    action_position$.subscribe(({ action, position }) => {
      this.currentPlayerPosition = position;
      this.render(position);
      if (this.isReached(position, this.goals)) {
        alert('Congratulations! You reached the goal! Click the Start Game button again to proceed to the next trial');
        this.clearMap();
        this.reachingFinished.emit();
        this.goals.length = 0;
        this.blocks.length = 0;
      }
      this.gameService.updateGame([position.x, position.y], [action.x, action.y], this.policy).subscribe(response => {
        // Handle response if necessary
      });
    });
  }

  initializeGame(game_map: any) {
    this.clearMap();
    this.goals = game_map.goals.map((goal: any) => ({
      x: goal[0], y: goal[1], color: this.getDefaultColor(), opacity: 1
    }));
    this.blocks = game_map.blocks.map((block: any) => ({
      x: block[0], y: block[1]
    }));
    this.currentPlayerPosition = this.playerStartingPosition;
    this.render(this.currentPlayerPosition);
    
    // Call the Python server to initialize the game
    this.gameService.initializeGame(game_map, this.currentPlayerPosition, 0.9, 0.1).subscribe(response => {
      this.policy = response.policy;
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

  getRandomColor() {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    return `rgb(${red}, ${green}, ${blue})`;
  }

  getDefaultColor() {
    const red = 50;
    const green = 10;
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
  }

  drawPlayer(playerPosition: { x: number, y: number }) {
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

  isReached(playerPosition: { x: number, y: number }, goals: any[]) {
    return goals.some(goal => goal.x === playerPosition.x && goal.y === playerPosition.y);
  }

  clearMap() {
    this.ctx.clearRect(0, 0, this.gameCanvas.nativeElement.width, this.gameCanvas.nativeElement.height);
    this.drawMap();
  }

  render(playerPosition: { x: number, y: number }) {
    this.clearMap();
    this.drawPlayer(playerPosition);
    this.drawGoals(this.goals);
    this.drawBlocks(this.blocks);
  }

  updateGoalColors(posterior: any) {
    this.goals[0].color = `rgb(${Math.floor(posterior.G1 * 255)}, 0, 0)`;
    this.goals[1].color = `rgb(${Math.floor(posterior.G2 * 255)}, 0, 0)`;
    this.goals[2].color = `rgb(${Math.floor(posterior.G3 * 255)}, 0, 0)`;
  }
}
