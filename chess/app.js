const BOARD_SIZE = {
  width: 0.75,
  height: 0.1,
  depth: 0.75
}

const MODEL = {
  PAWN: {
    OBJ: '../assets/chess/pawn/model.obj',
    MTL: '../assets/chess/pawn/materials.mtl',
    SCALE: 0.10,
    owner: {
      name: 'Joe Scalise',
      profileUrl: 'https://poly.google.com/user/5fiHEBToVIl'
    },
    model: {
      name: 'Storm Trooper 7 V1',
      polyUrl: 'https://poly.google.com/view/eZX_xt07DiL'
    }
  },
  BISHOP: {
    OBJ: '../assets/chess/bishop/model.obj',
    MTL: '../assets/chess/bishop/materials.mtl',
    SCALE: 0.00016,
    owner: {
      name: 'Evo',
      profileUrl: 'https://poly.google.com/user/0KYiq8tYHqj'
    },
     model: {
      name: 'Zombie',
      polyUrl: 'https://poly.google.com/view/9CXROSvbMm2'
    }
  },
  KING: {
    OBJ: '../assets/chess/king/model.obj',
    MTL: '../assets/chess/king/materials.mtl',
    SCALE: 0.026,
    owner: {
      name: 'Joe Tossey',
      profileUrl: 'https://poly.google.com/user/8arKEY9mH_T'
    },
     model: {
      name: 'Warrior',
      polyUrl: 'https://poly.google.com/view/eYBoTXiW9r2'
    }
  },
  KNIGHT: {
    OBJ: '../assets/chess/knight/minotour001.obj',
    MTL: '../assets/chess/knight/minotour001.mtl',
    SCALE: 0.000013,
    owner: {
      name: 'Marr Chal',
      profileUrl: 'https://poly.google.com/user/b8QoyjR2-kF'
    },
     model: {
      name: 'Minotour_Test001',
      polyUrl: 'https://poly.google.com/view/6IL8FMcduiE'
    }
  },
  QUEEN: {
    OBJ: '../assets/chess/queen/model.obj',
    MTL: '../assets/chess/queen/materials.mtl',
    SCALE: 0.026,
    owner: {
      name: 'Franck Corroy',
      profileUrl: 'https://poly.google.com/user/ffd53ejxgDk'
    },
     model: {
      name: 'Année 30 - Dame au manteau',
      polyUrl: 'https://poly.google.com/view/96IxuTK39fn'
    }
  },
  ROOK: {
    OBJ: '../assets/chess/rook/model.obj',
    MTL: '../assets/chess/rook/materials.mtl',
    SCALE: 0.20,
    owner: {
      name: 'Jarlan Perez',
      profileUrl: 'https://poly.google.com/user/4lZfAdz3x3X'
    },
     model: {
      name: 'Chess Rook',
      polyUrl: 'https://poly.google.com/view/417Xec_xlU0'
    }
  }
}

/**
 * Container class to manage connecting to the WebXR Device API
 * and handle rendering on every frame.
 */
class App {
  constructor() {
    this.onXRFrame = this.onXRFrame.bind(this);
    this.onEnterAR = this.onEnterAR.bind(this);
    this.projector = new THREE.Projector();

    this.init();
    this.onClick = this.onClick.bind(this);
    this.onDocumentMouseDown = this.onDocumentMouseDown.bind(this);
  }

  /**
   * Fetches the XRDevice, if available.
   */
  async init() {
    // The entry point of the WebXR Device API is on `navigator.xr`.
    // We also want to ensure that `XRSession` has `requestHitTest`,
    // indicating that the #webxr-hit-test flag is enabled.
    if (navigator.xr && XRSession.prototype.requestHitTest) {
      try {
        this.device = await navigator.xr.requestDevice();
      } catch (e) {
        // If there are no valid XRDevice's on the system,
        // `requestDevice()` rejects the promise. Catch our
        // awaited promise and display message indicating there
        // are no valid devices.
        this.onNoXRDevice();
        return;
      }
    } else {
      // If `navigator.xr` or `XRSession.prototype.requestHitTest`
      // does not exist, we must display a message indicating there
      // are no valid devices.
      this.onNoXRDevice();
      return;
    }

    // We found an XRDevice! Bind a click listener on our "Enter AR" button
    // since the spec requires calling `device.requestSession()` within a
    // user gesture.
    document.querySelector('#enter-ar').addEventListener('click', this.onEnterAR);
  }

  /**
   * Handle a click event on the '#enter-ar' button and attempt to
   * start an XRSession.
   */
  async onEnterAR() {
    // Now that we have an XRDevice, and are responding to a user
    // gesture, we must create an XRPresentationContext on a
    // canvas element.
    const outputCanvas = document.createElement('canvas');
    const ctx = outputCanvas.getContext('xrpresent');

    try {
      // Request a session for the XRDevice with the XRPresentationContext
      // we just created.
      // Note that `device.requestSession()` must be called in response to
      // a user gesture, hence this function being a click handler.
      const session = await this.device.requestSession({
        outputContext: ctx,
        environmentIntegration: true,
      });

      // If `requestSession` is successful, add the canvas to the
      // DOM since we know it will now be used.
      document.body.appendChild(outputCanvas);
      this.onSessionStarted(session)
    } catch (e) {
      // If `requestSession` fails, the canvas is not added, and we
      // call our function for unsupported browsers.
      this.onNoXRDevice();
    }
  }

  /**
   * Toggle on a class on the page to disable the "Enter AR"
   * button and display the unsupported browser message.
   */
  onNoXRDevice() {
    document.body.classList.add('unsupported');
  }

  /**
   * Called when the XRSession has begun. Here we set up our three.js
   * renderer, scene, and camera and attach our XRWebGLLayer to the
   * XRSession and kick off the render loop.
   */
  async onSessionStarted(session) {
    this.session = session;

    // Add the `ar` class to our body, which will hide our 2D components
    document.body.classList.add('ar');

    // To help with working with 3D on the web, we'll use three.js. Set up
    // the WebGLRenderer, which handles rendering to our session's base layer.
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.autoClear = false;

    this.gl = this.renderer.getContext();

    // Ensure that the context we want to write to is compatible
    // with our XRDevice
    await this.gl.setCompatibleXRDevice(this.session.device);

    // Set our session's baseLayer to an XRWebGLLayer
    // using our new renderer's context
    this.session.baseLayer = new XRWebGLLayer(this.session, this.gl);
    this.scene = DemoUtils.createLitScene();

    // Initialise pieces which holds all the information about every piece model in chess board.
    this.pieces = {
      white: {
        pawn: [],
        rook: [],
        knight: [],
        bishop: [],
        king: [],
        queen: []
      },
      black: {
        pawn: [],
        rook: [],
        knight: [],
        bishop: [],
        king: [],
        queen: []
      }
    };

    // Used to find if any other piece is already present in the position or not.
    this.piecePositions = {};
    this.areModelsReady = false;

    this.loadModels();
    this.updateCreditsInfo();

    // We'll update the camera matrices directly from API, so
    // disable matrix auto updates so three.js doesn't attempt
    // to handle the matrices independently.
    this.camera = new THREE.PerspectiveCamera();
    this.camera.matrixAutoUpdate = false;

    this.reticle = new Reticle(this.session, this.camera);
    this.scene.add(this.reticle);

    window.addEventListener('click', this.onClick);

    this.frameOfRef = await this.session.requestFrameOfReference('eye-level');
    this.session.requestAnimationFrame(this.onXRFrame);
  }

  updateCreditsInfo() {
    const creditDetailsElement = document.getElementById('creditDetails');
    creditDetailsElement.innerHTML = '';
    Object.keys(MODEL).forEach(key => {
      const piece = MODEL[key];
      const template = '<div class="modelOwner">' +
        '<a href="' + piece.model.polyUrl + '">' + piece.model.name + '</a> by ' +
        '<a href="' + piece.owner.profileUrl + '">' + piece.owner.name + ' </a>' +
      '</div>';
      creditDetailsElement.innerHTML += template;
    });
  }

  /**
   * Chess game needs to load 6 models, same models is used for opponents as well, by looking into the face position
   * of the piece opponent pieces can be differentiated. All pieces facing same side belongs to one player.
   * Here we make async call to load all model data and their materials.
   */
  loadModels() {
    const models = [];
    Object.keys(MODEL).forEach(key => {
      const piece = MODEL[key];
      models.push({
        objURL: piece.OBJ,
        mtlURL: piece.MTL
      });
    });

    DemoUtils.loadAllModels(models)
      .then(modelArrays => {
        this.areModelsReady = true;
        this.reticle.icon.ready = true;

        /* PAWN */
        const pawn = modelArrays[0];
        this.loadChessPiecesModel({
          model: pawn,
          scale: MODEL.PAWN.SCALE,
          name: "pawn",
          loop: 8,
          angle: Math.PI
        });

        /* BISHOP */
        const bishop = modelArrays[1];
        this.loadChessPiecesModel({
          model: bishop,
          scale: MODEL.BISHOP.SCALE,
          name: "bishop",
          loop: 2,
          angle: Math.PI
        });

        /* KING */
        const king = modelArrays[2];
        this.loadChessPiecesModel({
          model: king,
          scale: MODEL.KING.SCALE,
          name: "king",
          loop: 1,
          angle: Math.PI
        });

        /* KNIGHT */
        const knight = modelArrays[3];
        this.loadChessPiecesModel({
          model: knight,
          scale: MODEL.KNIGHT.SCALE,
          name: "knight",
          loop: 2
        });

        /* QUEEN */
        const queen = modelArrays[4];
        this.loadChessPiecesModel({
          model: queen,
          scale: MODEL.QUEEN.SCALE,
          name: "queen",
          loop: 1
        });

        /* ROOK */
        const rook = modelArrays[5];
        this.loadChessPiecesModel({
          model: rook,
          scale: MODEL.ROOK.SCALE,
          name: "rook",
          loop: 2,
          angle: Math.PI
        });

      });
  }

  loadChessPiecesModel({ model, scale = 1, name = "unknown", loop = 0, angle}) {
    for (let i = 0; i < loop; i++) {
      let piece = this.pieces.white[name];
      const newModel = model.clone();
      
      newModel.scale.set(scale, scale, scale);
      newModel.rotateY(angle || 0);
      newModel.name = "Piece-" + name + "-white-" + i;
      piece.push(newModel);

      piece = this.pieces.black[name];
      piece.push(model.clone());
      piece[i].scale.set(scale, scale, scale);
      !angle && piece[i].rotateY(Math.PI);
      piece[i].name = "Piece-" + name + "-black-" + i;
    }
  }

  /*
   * This function helps us select either the chess piece or the square where selected piece needs to be moved
   */
  onDocumentMouseDown(event) {
    event.preventDefault();

    const tapPosition = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      - (event.clientY / window.innerHeight) * 2 + 1
    );

    this.raycaster = this.raycaster || new THREE.Raycaster();
    this.raycaster.setFromCamera(tapPosition, this.camera);

    // Find objects which are in path of ray from raycaster
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    const intersect = intersects.find(model => model.face);
    let angleBeforeAnimation = 0;

    if (intersect) {
      if (this.selectedPiece) {
        const currentPiece = this.getSelectedPiece(intersects);
        
        // Reset selected piece if selected again
        if (currentPiece && currentPiece.name === this.selectedPiece.name) {
          this.resetSelectedPiece();
        }

        //Calculate centroid of selected square box, this will be the position where chess piece will be placed
        const geometry = intersect.object.geometry;
        const face = intersect.face;
        const vertices = geometry.vertices;
        const v1 = vertices[face.a];
        const v2 = vertices[face.b];
        const v3 = vertices[face.c];
        const pieceMove = this.calculateFaceCentroid(v1, v2, v3);

        // As we know each square box is actually 2 triangles with same color, make sure chess piece is always 
        // placed in triangle with even faceIndex
        this.currentIntersectFace = intersect.faceIndex % 2 === 0 ? intersect.faceIndex : intersect.faceIndex - 1;;
        this.selectedPiece.oldFaceIndex = this.selectedPiece.newFaceIndex || null;
        this.selectedPiece.newFaceIndex = this.currentIntersectFace;

        if (!this.validMove()) return;

        new TWEEN.Tween(this.selectedPiece.position)
          .to({ x: pieceMove.x, y: this.selectedPiece.position.y, z: pieceMove.z }, 1000)
          .easing(TWEEN.Easing.Elastic.InOut)
          .onUpdate(function (modelPiece) {
          })
          .start()
          .onComplete(() => {
            this.capturePiece();
            this.resetSelectedPiece();
          });

      } else {
        this.selectedPiece = this.getSelectedPiece(intersects);

        if(this.selectedPiece) {
          angleBeforeAnimation =  this.selectedPiece.rotation.y;
          this.tweenRotateSelectedPiece = new TWEEN.Tween(this.selectedPiece.rotation)
            .to({ x: this.selectedPiece.rotation.x, y: Math.PI * 2, z: this.selectedPiece.rotation.x }, 2000)
            .repeat(Infinity)
            .start()
            .onStop(() => {
              new TWEEN.Tween(this.selectedPiece.rotation)
                .to({ x: this.selectedPiece.rotation.x, y: angleBeforeAnimation, z: this.selectedPiece.rotation.x }, 2000)
                .start()
            });
        }
      }
    }
  }

  /**
   * This function decides the validity of the piece move, the only validation done is we should not place
   * pieces of same color/player in the same box.
   * 
   * TODO: Add more validation as per chess piece movement, eg a pawn can only move one square etc.
   */
  validMove() {
    // Check if already any existing piece present of same team
    if (this.piecePositions[this.currentIntersectFace]) {
      const capturedPieceInfo = this.getPieceInfo(this.piecePositions[this.currentIntersectFace]);
      const selectedPieceInfp = this.getPieceInfo(this.selectedPiece);
      return !(capturedPieceInfo.color === selectedPieceInfp.color)
    }
    return true;
  }

  resetSelectedPiece() {
    this.tweenRotateSelectedPiece.stop();
    delete this.tweenRotateSelectedPiece;
    delete this.piecePositions[this.selectedPiece.oldFaceIndex];
    this.selectedPiece = null;
  }

  getSelectedPiece(intersects) {
    const intersectedPiece = intersects.find(model => model.object.parent.name.includes("Piece"))
    return intersectedPiece ? intersectedPiece.object.parent : null;
  }

  /**
   * Function runs when you capture piece of the opponent. A smooth animation will move the captured chess piece
   * inside the chess board.
   */
  capturePiece() {
    if (this.piecePositions[this.currentIntersectFace]) {
      // There is already a piece in the box, capture it.
      const capturedPieceInfo = this.getPieceInfo(this.piecePositions[this.currentIntersectFace]);
      const dropPiece = this.pieces[capturedPieceInfo.color][capturedPieceInfo.type].splice(capturedPieceInfo.index, 1)[0];
      const dropTween = new TWEEN.Tween(dropPiece.position)
      .to({ x: dropPiece.position.x, y: dropPiece.position.y - 0.1, z: dropPiece.position.z }, 2000)
      .easing(TWEEN.Easing.Back.InOut);
      
      const rotateTween = new TWEEN.Tween(dropPiece.rotation)
      .to({ x: Math.PI / 2, y: dropPiece.position.y, z: dropPiece.position.z }, 1000);

      dropTween.chain(rotateTween);
      dropTween.start();
    }
    this.piecePositions[this.currentIntersectFace] = this.selectedPiece;
  }

  calculateFaceCentroid(v1, v2, v3) {
    let maxDistance = v1.distanceTo(v2);
    let longestLineCoordinate = [v1, v2];

    if (v2.distanceTo(v3) > maxDistance) {
      maxDistance = v2.distanceTo(v3);
      longestLineCoordinate = [v2, v3];
    }

    if (v3.distanceTo(v1) > maxDistance) {
      maxDistance = v3.distanceTo(v1);
      longestLineCoordinate = [v3, v1];
    }

    return new THREE.Vector3(
      (longestLineCoordinate[0].x + longestLineCoordinate[1].x) / 2,
      longestLineCoordinate[0].y,
      (longestLineCoordinate[0].z + longestLineCoordinate[1].z) / 2
    )
  }

  /**
   * This function is called when you click on reticle. The Chess board is created 
   * and all the chess pieces are added into the board in their respective positions.
   */
  async onClick(e) {
    if (!this.areModelsReady) return;

    this.gameStarted = true;
    const x = 0;
    const y = 0;

    this.raycaster = this.raycaster || new THREE.Raycaster();
    this.raycaster.setFromCamera({ x, y }, this.camera);

    const ray = this.raycaster.ray;
    const origin = new Float32Array(ray.origin.toArray());
    const direction = new Float32Array(ray.direction.toArray());
    const hits = await this.session.requestHitTest(origin, direction, this.frameOfRef);

    if (hits.length) {
      const hit = hits[0];
      const hitMatrix = new THREE.Matrix4().fromArray(hit.hitMatrix);

      // Set board
      const board = this.createChessBoard()
      board.position.setFromMatrixPosition(hitMatrix);
      const boardSquareSize = BOARD_SIZE.width / 8;

      /* Set pawn */
      const pawn = new THREE.Box3().setFromObject(this.pieces.white.pawn[0]);
      const pawnSize = pawn.getSize();
      for (let i = 0; i <= 7; i++) {
        let pawnPosition = new THREE.Vector3(
          BOARD_SIZE.width / 2 - boardSquareSize / 2 - i * boardSquareSize,
          BOARD_SIZE.height / 2 + pawnSize.y / 2,
          -BOARD_SIZE.depth / 2 + 3 * boardSquareSize / 2
        );
        this.pieces.white.pawn[i].position.set(pawnPosition.x, pawnPosition.y, pawnPosition.z);
        board.children[0].add(this.pieces.white.pawn[i]);

        pawnPosition = new THREE.Vector3(
          BOARD_SIZE.width / 2 - boardSquareSize / 2 - i * boardSquareSize,
          BOARD_SIZE.height / 2 + pawnSize.y / 2,
          BOARD_SIZE.depth / 2 - 3 * boardSquareSize / 2
        );
        this.pieces.black.pawn[i].position.set(pawnPosition.x, pawnPosition.y, pawnPosition.z);
        board.children[0].add(this.pieces.black.pawn[i]);
      }

      /* Set rook */
      const rook = new THREE.Box3().setFromObject(this.pieces.white.rook[0]);
      const rookSize = rook.getSize();
      for (let i = 0; i < 2; i++) {
        let rookPosition = new THREE.Vector3(
          BOARD_SIZE.width / 2 - boardSquareSize / 2 - i * 7 * boardSquareSize,
          BOARD_SIZE.height / 2 + rookSize.y / 2,
          -BOARD_SIZE.depth / 2 + boardSquareSize / 2
        );
        this.pieces.white.rook[i].position.set(rookPosition.x, rookPosition.y, rookPosition.z);
        this.pieces.white.rook[i].children[0].material.color = new THREE.Color( 0xffffff );;
        board.children[0].add(this.pieces.white.rook[i]);

        rookPosition = new THREE.Vector3(
          BOARD_SIZE.width / 2 - boardSquareSize / 2 - i * 7 * boardSquareSize,
          BOARD_SIZE.height / 2 + rookSize.y / 2,
          BOARD_SIZE.depth / 2 - boardSquareSize / 2
        );
        this.pieces.black.rook[i].position.set(rookPosition.x, rookPosition.y, rookPosition.z);
        board.children[0].add(this.pieces.black.rook[i]);
      }

      /* Set knight */
      for (let i = 0; i < 2; i++) {
        let knightPosition = new THREE.Vector3(
          BOARD_SIZE.width / 2 - boardSquareSize / 2 - boardSquareSize - i * 5 * boardSquareSize,
          BOARD_SIZE.height / 2,
          -BOARD_SIZE.depth / 2 + boardSquareSize / 2
        );
        this.pieces.white.knight[i].position.set(knightPosition.x, knightPosition.y, knightPosition.z);
        board.children[0].add(this.pieces.white.knight[i]);

        knightPosition = new THREE.Vector3(
          BOARD_SIZE.width / 2 - boardSquareSize / 2 - boardSquareSize - i * 5 * boardSquareSize,
          BOARD_SIZE.height / 2,
          BOARD_SIZE.depth / 2 - boardSquareSize / 2
        );
        this.pieces.black.knight[i].position.set(knightPosition.x, knightPosition.y, knightPosition.z);
        board.children[0].add(this.pieces.black.knight[i]);
      }

      /* Set bishop */
      for (let i = 0; i < 2; i++) {
        let bishopPosition = new THREE.Vector3(
          BOARD_SIZE.width / 2 - boardSquareSize / 2 - 2 * boardSquareSize - i * 3 * boardSquareSize,
          BOARD_SIZE.height / 2,
          -BOARD_SIZE.depth / 2 + boardSquareSize / 2
        );
        this.pieces.white.bishop[i].position.set(bishopPosition.x, bishopPosition.y, bishopPosition.z);
        board.children[0].add(this.pieces.white.bishop[i]);

        bishopPosition = new THREE.Vector3(
          BOARD_SIZE.width / 2 - boardSquareSize / 2 - 2 * boardSquareSize - i * 3 * boardSquareSize,
          BOARD_SIZE.height / 2,
          BOARD_SIZE.depth / 2 - boardSquareSize / 2
        );
        this.pieces.black.bishop[i].position.set(bishopPosition.x, bishopPosition.y, bishopPosition.z);
        board.children[0].add(this.pieces.black.bishop[i]);
      }

      /* Set king */
      const king = new THREE.Box3().setFromObject(this.pieces.white.king[0]);
      const kingSize = king.getSize();
      let kingPosition = new THREE.Vector3(
        BOARD_SIZE.width / 2 - boardSquareSize / 2 - 3 * boardSquareSize,
        BOARD_SIZE.height / 2 + kingSize.y / 2,
        -BOARD_SIZE.depth / 2 + boardSquareSize / 2
      );
      this.pieces.white.king[0].position.set(kingPosition.x, kingPosition.y, kingPosition.z);
      board.children[0].add(this.pieces.white.king[0]);

      kingPosition = new THREE.Vector3(
        BOARD_SIZE.width / 2 - boardSquareSize / 2 - 3 * boardSquareSize,
        BOARD_SIZE.height / 2 + kingSize.y / 2,
        BOARD_SIZE.depth / 2 - boardSquareSize / 2
      );
      this.pieces.black.king[0].position.set(kingPosition.x, kingPosition.y, kingPosition.z);
      board.children[0].add(this.pieces.black.king[0]);

      /* Set queen */
      let queen = new THREE.Box3().setFromObject(this.pieces.white.queen[0]);
      const queenSize = queen.getSize();
      let queenPosition = new THREE.Vector3(
        BOARD_SIZE.width / 2 - boardSquareSize / 2 - 4 * boardSquareSize,
        BOARD_SIZE.height / 2 + queenSize.y / 2,
        -BOARD_SIZE.depth / 2 + boardSquareSize / 2
      );
      this.pieces.white.queen[0].position.set(queenPosition.x, queenPosition.y, queenPosition.z);
      board.children[0].add(this.pieces.white.queen[0]);

      queenPosition = new THREE.Vector3(
        BOARD_SIZE.width / 2 - boardSquareSize / 2 - 4 * boardSquareSize,
        BOARD_SIZE.height / 2 + queenSize.y / 2,
        BOARD_SIZE.depth / 2 - boardSquareSize / 2
      );
      this.pieces.black.queen[0].position.set(queenPosition.x, queenPosition.y, queenPosition.z);
      board.children[0].add(this.pieces.black.queen[0]);

      // this.scene.add(new THREE.AxesHelper( 10 )); // This will show you the 3 axis in screen, used to position 3D models.
      DemoUtils.lookAtOnY(board, this.camera);
      this.scene.add(board);
      this.reticle.visible = false;
      window.removeEventListener('click', this.onClick);
      document.addEventListener('mousedown', this.onDocumentMouseDown, false);
    }
  }

  createChessBoard() {
    // Geometry
    const cbgeometry = new THREE.BoxGeometry(BOARD_SIZE.width, BOARD_SIZE.height, BOARD_SIZE.depth, 8, 0, 8);

    // Materials
    const cbmaterials = [];

    cbmaterials.push(new THREE.MeshBasicMaterial(
      {
        color: 0xffffff,
        side: THREE.FrontSide,
        vertexColors: true,
        transparent: true,
        // wireframe: true, // Uncomment these two lines to see skeleton of chess board
        // wireframeLinewidth: 8,
        opacity: 0.8
      }));
    cbmaterials.push(new THREE.MeshBasicMaterial(
      {
        color: 0x000000,
        side: THREE.DoubleSide,
        vertexColors: true,
        transparent: true,
        // wireframe: true, // Uncomment these two lines to see skeleton of chess board
        // wireframeLinewidth: 8,
        opacity: 0.8
      }));

    const l = cbgeometry.faces.length / 2;

    for (let i = 0; i < l; i++) {
      const j = i * 2;
      cbgeometry.faces[j].materialIndex = ((i + Math.floor(i / 8)) % 2);
      cbgeometry.faces[j + 1].materialIndex = ((i + Math.floor(i / 8)) % 2);
    }

    const chessBoardMesh = new THREE.Mesh(cbgeometry, new THREE.MeshFaceMaterial(cbmaterials));
    chessBoardMesh.name = "Chess board"
    const group = new THREE.Group();
    group.add(chessBoardMesh);

    return group
  }

  getPieceInfo(piece) {
    const pieceNameSplit = piece.name.split('-');
    return {
      type: pieceNameSplit[1],
      color: pieceNameSplit[2],
      index: parseInt(pieceNameSplit[3]),
      facing: pieceNameSplit[2].toLowerCase() === "white" ? 0 : 1
    }
  }

  /**
   * Called on the XRSession's requestAnimationFrame.
   * Called with the time and XRPresentationFrame.
   */
  onXRFrame(time, frame) {
    let session = frame.session;
    let pose = frame.getDevicePose(this.frameOfRef);

    this.gameStarted || this.reticle.update(this.frameOfRef);
    if (this.reticle.visible && !this.stabilized) {
      this.stabilized = true;
      document.body.classList.add('stabilized');
    }

    // Queue up the next frame
    session.requestAnimationFrame(this.onXRFrame);

    TWEEN.update();

    // Bind the framebuffer to our baseLayer's framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.session.baseLayer.framebuffer);

    if (pose) {
      // Our XRFrame has an array of views. In the VR case, we'll have
      // two views, one for each eye. In mobile AR, however, we only
      // have one view.
      for (let view of frame.views) {
        const viewport = session.baseLayer.getViewport(view);
        this.renderer.setSize(viewport.width, viewport.height);

        // Set the view matrix and projection matrix from XRDevicePose
        // and XRView onto our THREE.Camera.
        this.camera.projectionMatrix.fromArray(view.projectionMatrix);
        const viewMatrix = new THREE.Matrix4().fromArray(pose.getViewMatrix(view));
        this.camera.matrix.getInverse(viewMatrix);
        this.camera.updateMatrixWorld(true);

        // Render our scene with our THREE.WebGLRenderer
        this.renderer.render(this.scene, this.camera);
      }
    }
  }
};

function toggleCredits(e) {
  e.currentTarget.nextElementSibling.classList.toggle("show");
}

window.app = new App();
