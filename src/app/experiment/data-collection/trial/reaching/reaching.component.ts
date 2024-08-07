import { Component, ElementRef, Input, OnInit, SimpleChanges, OnDestroy, OnChanges, ViewChild, Output, EventEmitter } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { map, filter, pluck, scan, withLatestFrom } from 'rxjs/operators';
import { GameService } from '@app/experiment/data-collection/services/game.service'

@Component({
  selector: 'app-reaching',
  templateUrl: './reaching.component.html',
  styleUrls: ['./reaching.component.css']
})
export class ReachingComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('gameCanvas', { static: true }) gameCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('clickMe', { static: true }) clickMe!: ElementRef<HTMLButtonElement>;
  @Input() trialNumber!: number;
  @Output() reachingFinished = new EventEmitter<void>();

  //Declaration
  private ctx!: CanvasRenderingContext2D;
  private gridNumber = 10;
  private cellSize!: number;
  private playerStartingPosition: { x: number; y: number } = { x: 0, y: 0 }; // Initial default position
  private currentPlayerPosition = this.playerStartingPosition;
  private socket!: Socket;
  private goals: any[] = [];
  private blocks: any[] = [];
  private policy: any;
  private subscriptions: Subscription[] = [];

  //constructor for injecting the game service
  constructor(private gameService: GameService) {
    this.initializeSocket();
  }

  ngOnInit() {
    this.initializeCanvas();
    this.setupEventListeners();
    this.initializeGameForTrial();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trialNumber'] && !changes['trialNumber'].firstChange) {
      this.initializeGameForTrial();
    }
  }

  ngOnDestroy() {
    this.cleanupSubscriptions();
  }

  //Initialize Socket and create event listeners to get info from the server 
  private initializeSocket() {
    //Establish socket connection
    this.socket = io('http://localhost:3000');
    //Gets the map from the server
    this.socket.on('initializeGame', (game_map: any) => {
      this.initializeGame(game_map);
    });
    //Updates the redness of the goals to dynamically reflect changes in posterior 
    this.socket.on('updatePosterior', (posterior: any) => {
      this.updateGoalColors(posterior);
      this.render(this.currentPlayerPosition);
    });
  }

  // Prepare the canvas context
  private initializeCanvas() {
    const canvasElement = this.gameCanvas.nativeElement;
    this.ctx = canvasElement.getContext('2d')!;
    this.cellSize = canvasElement.width / this.gridNumber;
  }

  // Setup event listeners for user interaction
  private setupEventListeners() {
    
    //Observables
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
        console.log("Current Position:", playerPosition, "Movement:", movement); // Debugging log
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
    

    //Subscriptions
    const clickSubscription = fromEvent(this.clickMe.nativeElement, 'click').subscribe(() => {
      this.socket.emit('playerReady', 'Player is ready!');
    });

    const actionPositionSubscription = updatePlayerPos$.subscribe((newPosition) => {
      this.currentPlayerPosition = newPosition;
      this.render(newPosition);
      if (this.isReached(newPosition, this.goals)) {
        alert('Congratulations! You reached the goal! Click the Start Game button again to proceed to the next trial');
        this.clearMap();
        this.clearGameState();
        this.reachingFinished.emit();
      }
    });
    this.subscriptions.push(clickSubscription, actionPositionSubscription);
  }

  // Initialize game for the current trial
  private initializeGameForTrial() {
    this.socket.emit('requestMap', { trialNumber: this });
  }

  // Initialize the game state based on the received game map
  private initializeGame(game_map: any) {
    this.clearMap();
    this.playerStartingPosition = {
      x: game_map.playerPosition[0],
      y: game_map.playerPosition[1]
    };
    this.goals = game_map.goals.map((goal: any) => ({
      x: goal[0], y: goal[1], color: this.getDefaultColor(), opacity: 1
    }));
    this.blocks = game_map.blocks.map((block: any) => ({
      x: block[0], y: block[1]
    }));
    this.currentPlayerPosition = this.playerStartingPosition;
    this.render(this.currentPlayerPosition);
    
    // Call the server to initialize the game
    this.gameService.initializeGame(game_map, this.currentPlayerPosition, 0.9, 0.1).subscribe(response => {
      this.policy = response.policy;
    });
  }

  // Clean up all active subscriptions to prevent memory leaks
  private cleanupSubscriptions() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions = [];
  }

  // Draw the grid map on the canvas
  private drawMap() {
    for (let i = 0; i < this.gridNumber * this.gridNumber; i++) {
      const x = (i % this.gridNumber) * this.cellSize;
      const y = Math.floor(i / this.gridNumber) * this.cellSize;
      this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
    }
  }

  // Draw blocks on the canvas
  private drawBlocks(blocks: any[]) {
    blocks.forEach(block => {
      this.ctx.fillStyle = 'brown';
      this.ctx.globalAlpha = 1;
      this.ctx.fillRect(block.x * this.cellSize, block.y * this.cellSize, this.cellSize, this.cellSize);
    });
  }

  // Generate a random color
  private getRandomColor() {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    return `rgb(${red}, ${green}, ${blue})`;
  }

  // Get the default color for goals
  private getDefaultColor() {
    const red = 50;
    const green = 10;
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
  }

  // Draw the player on the canvas
  private drawPlayer(playerPosition: { x: number, y: number }) {
    this.ctx.beginPath();
    this.ctx.fillStyle = 'blue';
    this.ctx.arc(playerPosition.x * this.cellSize + (this.cellSize / 2), playerPosition.y * this.cellSize + (this.cellSize / 2), this.cellSize / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  // Draw goals on the canvas
  private drawGoals(goals: any[]) {
    goals.forEach(goal => {
      this.ctx.fillStyle = goal.color;
      this.ctx.globalAlpha = 1;
      this.ctx.fillRect(goal.x * this.cellSize, goal.y * this.cellSize, this.cellSize, this.cellSize);
    });
    this.ctx.globalAlpha = 1;
  }

  // Check if the player has reached any goals
  private isReached(playerPosition: { x: number, y: number }, goals: any[]) {
    return goals.some(goal => goal.x === playerPosition.x && goal.y === playerPosition.y);
  }

  // Clear the map and redraw it
  private clearMap() {
    this.ctx.clearRect(0, 0, this.gameCanvas.nativeElement.width, this.gameCanvas.nativeElement.height);
    this.drawMap();
  }

  private clearGameState() {
    this.goals.length = 0;
    this.blocks.length = 0;
  }
  // Render the entire game state
  private render(playerPosition: { x: number, y: number }) {
    this.clearMap();
    this.drawPlayer(playerPosition);
    this.drawGoals(this.goals);
    this.drawBlocks(this.blocks);
  }

  // Update the colors of the goals based on the posterior probabilities
  private updateGoalColors(posterior: any) {
    this.goals[0].color = `rgb(${Math.floor(posterior.G1 * 255)}, 0, 0)`;
    this.goals[1].color = `rgb(${Math.floor(posterior.G2 * 255)}, 0, 0)`;
    this.goals[2].color = `rgb(${Math.floor(posterior.G3 * 255)}, 0, 0)`;
  }
}