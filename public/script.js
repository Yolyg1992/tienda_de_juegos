// GameStore - Gestiona la carga, búsqueda, filtrado y renderizado
class GameStore {
    constructor() {

        // Estado de la aplicación
        this.games = [];
        this.currentSearch = "";
        this.currentStore = "";
        this.currentSort = "";
        this.maxGames = 15;

        // Inicializar elementos y eventos
        this.initializeElements();
        this.attachEventListeners();

        // Cargar juegos al iniciar
        this.loadInitialGames();
    }

    // Obtiene referencias a elementos del DOM
    initializeElements() {
        this.gamesGrid = document.getElementById("grid");
        this.loadingIndicator = document.getElementById("loading");
        this.errorMessage = document.getElementById("error");
        this.noResults = document.getElementById("noResults");

        this.searchInput = document.getElementById("search");
        this.searchBtn = document.getElementById("btnSearch");
        this.storeFilter = document.getElementById("storeSelect");
        this.sortSelect = document.getElementById("sortSelect");

        this.loadMoreBtn = document.getElementById("loadMore");

        this.gameModal = document.getElementById("modal");
        this.modalContent = document.getElementById("modalContent");
        this.closeModalBtn = document.getElementById("closeModal");
    }

    // Configura event listeners
    attachEventListeners() {

        // Evento de búsqueda por botón
        this.searchBtn.addEventListener("click", () => this.handleSearch());

        // Buscar al presionar Enter
        this.searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.handleSearch();
        });

        // Filtro por tienda
        this.storeFilter.addEventListener("change", () => this.handleFilter());

        // Ordenamiento por precio
        this.sortSelect.addEventListener("change", () => this.handleSort());

        // Cargar más (se desactiva porque solo se permiten 15 juegos)
        this.loadMoreBtn.addEventListener("click", () => this.disableLoadMore());

        // Cerrar modal
        this.closeModalBtn.addEventListener("click", () => this.closeGameModal());

        // Cerrar modal desde el fondo
        this.gameModal.addEventListener("click", (e) => {
            if (e.target === this.gameModal) this.closeGameModal();
        });
    }

    // Carga máximo 15 juegos iniciales
    async loadInitialGames() {
        this.showLoading();
        this.hideError();
        this.hideNoResults();

        try {
            const response = await fetch(
                `https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=${this.maxGames}`
            );

            if (!response.ok) throw new Error("Error en la API");

            const data = await response.json();
            this.games = Array.isArray(data) ? data.slice(0, this.maxGames) : [];

            this.renderGames(this.games);
            this.disableLoadMore();
            this.hideLoading();

            if (this.games.length === 0) this.showNoResults();

        } catch (error) {
            this.showError();
            this.hideLoading();
            console.error(error);
        }
    }

    // Busca juegos por nombre
    async handleSearch() {
        const term = this.searchInput.value.trim();

        this.currentSearch = term;
        this.showLoading();
        this.hideNoResults();
        this.hideError();

        try {
            let url = "";

            if (term !== "") {
                url = `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(
                    term
                )}&limit=${this.maxGames}`;
            } else {
                // Si la búsqueda está vacía → recargar lista inicial
                return this.loadInitialGames();
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error("Error en búsqueda");

            const data = await response.json();
            this.games = data.slice(0, this.maxGames);

            this.renderGames(this.games);
            this.disableLoadMore();
            this.hideLoading();

            if (this.games.length === 0) this.showNoResults();

        } catch (error) {
            this.showError();
            this.hideLoading();
        }
    }

    // Filtra por tienda
    handleFilter() {
        this.currentStore = this.storeFilter.value;
        this.applyFiltersAndSort();
    }

    // Ordena por criterio
    handleSort() {
        this.currentSort = this.sortSelect.value;
        this.applyFiltersAndSort();
    }

    // Aplica filtros y ordenamiento
    applyFiltersAndSort() {
        let filtered = [...this.games];

        // Aplicar filtro por tienda
        if (this.currentStore !== "") {
            filtered = filtered.filter(
                (game) => game.storeID == this.currentStore
            );
        }

        // Aplicar ordenamiento
        switch (this.currentSort) {
            case "salePriceAsc":
                filtered.sort((a, b) => a.salePrice - b.salePrice);
                break;
            case "salePriceDesc":
                filtered.sort((a, b) => b.salePrice - a.salePrice);
                break;
            case "normalPriceAsc":
                filtered.sort((a, b) => a.normalPrice - b.normalPrice);
                break;
            case "normalPriceDesc":
                filtered.sort((a, b) => b.normalPrice - a.normalPrice);
                break;
            case "savingsDesc":
                filtered.sort((a, b) => b.savings - a.savings);
                break;
            case "titleAsc":
                filtered.sort((a, b) =>
                    (a.title || "").localeCompare(b.title || "")
                );
                break;
        }

        this.renderGames(filtered);

        if (filtered.length === 0) this.showNoResults();
    }

    // Renderiza tarjetas dinámicamente
    renderGames(list) {
        this.clearGamesGrid();

        if (!list || list.length === 0) {
            this.showNoResults();
            return;
        }

        list.forEach((game) => {
            this.gamesGrid.appendChild(this.createGameCard(game));
        });
    }

    // Crea una tarjeta de juego
    createGameCard(game) {
        const card = document.createElement("div");
        card.className =
            "game-card bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 fade-in";

        const discount = Math.round(game.savings || 0);

        card.innerHTML = `
            <div class="relative overflow-hidden">
                <img src="${game.thumb}" 
                class="w-full h-40 object-cover">

                ${
                    discount > 0
                        ? `
                    <div class="absolute top-3 right-3">
                        <span class="discount-badge px-3 py-1 rounded-lg text-white text-sm font-bold">
                            -${discount}%
                        </span>
                    </div>
                `
                        : ""
                }
            </div>

            <div class="p-4">
                <h3 class="font-semibold text-lg mb-2 line-clamp-2">${game.title}</h3>

                <p class="text-gray-600 text-sm line-clamp-2 mb-3">
                    ${
                        game.steamRatingPercent
                            ? "Juego popular con reseñas positivas en Steam y ofertas activas."
                            : "Título con información básica disponible y oferta destacada."
                    }
                </p>

                <div class="flex items-center justify-between mb-3">
                    <div>
                        ${
                            discount > 0
                                ? `<span class="line-through text-gray-500 text-sm">$${game.normalPrice}</span>`
                                : ""
                        }
                        <span class="text-green-600 font-bold ml-2">$${game.salePrice}</span>
                    </div>

                    <span class="text-yellow-500 text-sm">★ ${
                        game.steamRatingPercent || "N/A"
                    }%</span>
                </div>

                <button 
                    onclick="gameStore.showGameDetails('${game.gameID}')"
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-bold transition-all text-sm shadow-md">
                    Ver detalle
                </button>
            </div>
        `;

        return card;
    }

    // Obtiene y muestra detalles del juego
    async showGameDetails(gameId) {
        this.showLoading();

        try {
            const response = await fetch(
                `https://www.cheapshark.com/api/1.0/games?id=${gameId}`
            );

            if (!response.ok) throw new Error("Error en detalles");

            const details = await response.json();
            this.openGameModal(details);

            this.hideLoading();

        } catch (error) {
            alert("Error al cargar detalles");
            this.hideLoading();
        }
    }

    // Abre modal con detalles
    openGameModal(details) {
        const info = details.info || {};
        const deals = details.deals?.[0] || {};

        this.modalContent.innerHTML = `
            <h2 class="text-2xl font-bold mb-4">${info.title}</h2>

            <img src="${info.thumb}" class="w-full h-64 object-cover rounded-lg shadow-lg mb-6">

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="p-4 bg-gray-100 rounded border">
                    <h4 class="font-semibold text-gray-600 mb-2">Precio Original</h4>
                    <p class="text-gray-800 line-through text-xl">$${deals.retailPrice}</p>
                </div>

                <div class="p-4 bg-green-50 rounded border">
                    <h4 class="font-semibold text-green-700 mb-2">Precio Oferta</h4>
                    <p class="text-green-800 font-bold text-xl">$${deals.price}</p>
                </div>
            </div>

            <div class="mt-6 text-center">
                <a href="https://store.steampowered.com/app/${info.steamAppID}" 
                target="_blank" class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold">
                    Ver en Steam
                </a>
            </div>
        `;

        this.gameModal.classList.remove("hidden");
    }

    // Cierra el modal
    closeGameModal() {
        this.gameModal.classList.add("hidden");
    }

    // Desactiva botón de cargar más
    disableLoadMore() {
        this.loadMoreBtn.disabled = true;
        this.loadMoreBtn.textContent = "NO HAY MÁS JUEGOS";
    }

    // Limpia el grid
    clearGamesGrid() {
        this.gamesGrid.innerHTML = "";
    }

    // Indicadores visuales
    showLoading() {
        this.loadingIndicator.classList.remove("hidden");
    }
    hideLoading() {
        this.loadingIndicator.classList.add("hidden");
    }
    showError() {
        this.errorMessage.classList.remove("hidden");
    }
    hideError() {
        this.errorMessage.classList.add("hidden");
    }
    showNoResults() {
        this.noResults.classList.remove("hidden");
    }
    hideNoResults() {
        this.noResults.classList.add("hidden");
    }
}

// Inicia la aplicación
document.addEventListener("DOMContentLoaded", () => {
    window.gameStore = new GameStore();
});
