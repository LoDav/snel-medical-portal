<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getUserInfo } from '@/utils/auth';

import DashboardLink from '../ui-components/DashboardLink.vue';
import ThemeSwitcher from '../ui-components/ThemeSwitcher.vue';
import HeaderUser from '../ui-components/HeaderUser.vue';

const router = useRouter();
const userInfo = ref(null);

// Placeholder data for medications
const medications = ref([
    {
        id: 1,
        nom: 'Paracétamol',
        dosage: '500mg',
        forme: 'Comprimé',
        stock: 150,
        seuil: 50,
        statut: 'Disponible'
    },
    {
        id: 2,
        nom: 'Ibuprofène',
        dosage: '200mg',
        forme: 'Comprimé',
        stock: 80,
        seuil: 30,
        statut: 'Disponible'
    },
    {
        id: 3,
        nom: 'Amoxicilline',
        dosage: '500mg',
        forme: 'Gélule',
        stock: 25,
        seuil: 50,
        statut: 'Stock faible'
    },
    {
        id: 4,
        nom: 'Insuline',
        dosage: '100UI/ml',
        forme: 'Injection',
        stock: 0,
        seuil: 10,
        statut: 'Rupture de stock'
    }
]);

const goTo = (url) => {
    router.push(url);
};

onMounted(() => {
    userInfo.value = getUserInfo();
});
</script>

<template>
    <nav class="animate__animated animate__fadeIn">
        <div class="navbar">
            <a href="#" class="navbar-brand">MediApp</a>
            <ul class="navbar-nav">
                <DashboardLink text="Tableau de bord" icon="tachometer" to="/pharmacie/tableau-de-bord" />
                <DashboardLink text="Médicaments" icon="medkit" to="/pharmacie/medicaments" :active="true" />
                <DashboardLink text="Stocks" icon="cubes" to="/pharmacie/stocks" />
                <DashboardLink text="Dispensations" icon="pills" to="/pharmacie/dispensations" />
                <DashboardLink text="Inventaire" icon="list" to="/pharmacie/inventaire" />
            </ul>
            <div class="d-flex">
                <div>
                    <ThemeSwitcher />
                </div>
                <div class="ml-3">
                    <header-user />
                </div>
            </div>
        </div>
    </nav>

    <div class="main-wrapper animate__animated animate__fadeIn">
        <div class="container">
            <div class="header">
                <div v-if="userInfo">
                    <h1>Gestion des Médicaments</h1>
                </div>
            </div>

            <div class="main-content">
                <div class="card">
                    <div class="card-header">Actions Rapides</div>
                    <div class="card-content">
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <button class="btn btn-primary">Ajouter un Médicament</button>
                            <button class="btn btn-secondary">Importer depuis Excel</button>
                            <button class="btn btn-info">Exporter la Liste</button>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">Filtres et Recherche</div>
                    <div class="card-content">
                        <div class="filters">
                            <input type="text" placeholder="Rechercher par nom..." class="form-control"
                                style="margin-bottom: 10px;">
                            <select class="form-control" style="margin-bottom: 10px;">
                                <option value="">Tous les statuts</option>
                                <option value="disponible">Disponible</option>
                                <option value="stock-faible">Stock faible</option>
                                <option value="rupture">Rupture de stock</option>
                            </select>
                            <button class="btn btn-outline-primary">Appliquer les filtres</button>
                        </div>
                    </div>
                </div>

                <div class="card full-width">
                    <div class="card-header">Liste des Médicaments</div>
                    <div class="card-content">
                        <table class="medications-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nom</th>
                                    <th>Dosage</th>
                                    <th>Forme</th>
                                    <th>Stock</th>
                                    <th>Seuil</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="med in medications" :key="med.id">
                                    <td>{{ med.id }}</td>
                                    <td>{{ med.nom }}</td>
                                    <td>{{ med.dosage }}</td>
                                    <td>{{ med.forme }}</td>
                                    <td>{{ med.stock }}</td>
                                    <td>{{ med.seuil }}</td>
                                    <td>
                                        <span :class="['status', {
                                            'available': med.statut === 'Disponible',
                                            'low-stock': med.statut === 'Stock faible',
                                            'out-of-stock': med.statut === 'Rupture de stock'
                                        }]">{{ med.statut }}</span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary">Modifier</button>
                                        <button class="btn btn-sm btn-outline-danger">Supprimer</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">Statistiques des Médicaments</div>
                    <div class="card-content stat-grid">
                        <div class="stat-item">
                            <div class="value">{{ medications.length }}</div>
                            <div class="label">Total Médicaments</div>
                        </div>
                        <div class="stat-item">
                            <div class="value">{{medications.filter(m => m.statut === 'Disponible').length}}</div>
                            <div class="label">Disponibles</div>
                        </div>
                        <div class="stat-item">
                            <div class="value">{{medications.filter(m => m.statut === 'Stock faible').length}}</div>
                            <div class="label">Stock Faible</div>
                        </div>
                        <div class="stat-item">
                            <div class="value">{{medications.filter(m => m.statut === 'Rupture de stock').length}}
                            </div>
                            <div class="label">Rupture de Stock</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.main-content {
    padding: 20px;
    display: grid;
    overflow-y: auto;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.full-width {
    grid-column: 1 / -1;
}

.card {
    background-color: var(--gh-card-bg);
    border: 1px solid var(--gh-border-color);
    border-radius: 6px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.card-header {
    font-size: 18px;
    font-weight: 600;
    color: var(--gh-text-color);
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--gh-border-color);
}

.card-content {
    flex-grow: 1;
}

.filters {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.medications-table {
    width: 100%;
    border-collapse: collapse;
}

.medications-table th,
.medications-table td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid var(--gh-border-color);
}

.medications-table th {
    background-color: var(--gh-border-color);
    font-weight: 600;
}

.status {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
}

.status.available {
    background-color: var(--gh-success-green);
    color: white;
}

.status.low-stock {
    background-color: var(--gh-warning-orange);
    color: white;
}

.status.out-of-stock {
    background-color: var(--gh-danger-red);
    color: white;
}

.stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 10px;
}

.stat-item {
    border: 1px solid var(--gh-border-color);
    border-radius: 4px;
    padding: 10px;
    text-align: center;
}

.stat-item .value {
    font-size: 24px;
    font-weight: 700;
    color: var(--gh-primary-blue);
    margin-bottom: 5px;
}

.stat-item .label {
    font-size: 12px;
    color: #586069;
    text-transform: uppercase;
}

.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-right: 5px;
}

.btn-primary {
    background-color: var(--gh-primary-blue);
    color: white;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
}

.btn-info {
    background-color: #17a2b8;
    color: white;
}

.btn-outline-primary {
    border: 1px solid var(--gh-primary-blue);
    color: var(--gh-primary-blue);
    background-color: transparent;
}

.btn-outline-danger {
    border: 1px solid var(--gh-danger-red);
    color: var(--gh-danger-red);
    background-color: transparent;
}

.btn-sm {
    padding: 4px 8px;
    font-size: 12px;
}

.form-control {
    padding: 8px;
    border: 1px solid var(--gh-border-color);
    border-radius: 4px;
    font-size: 14px;
}
</style>