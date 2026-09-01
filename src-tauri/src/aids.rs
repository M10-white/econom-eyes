use chrono::{NaiveDate, Utc, Datelike};
use crate::models::{UserProfile, AidResult};

fn age_from_profile(profile: &UserProfile) -> Option<i32> {
    let birth = profile.birth_date.as_ref()?;
    let birth = NaiveDate::parse_from_str(birth, "%Y-%m-%d").ok()?;
    let today = Utc::now().date_naive();
    let mut age = today.year() - birth.year();
    if (today.month(), today.day()) < (birth.month(), birth.day()) {
        age -= 1;
    }
    Some(age)
}

pub fn check_all_aids(profile: &UserProfile) -> Vec<AidResult> {
    let age = age_from_profile(profile);
    vec![
        check_apl(profile, age),
        check_prime_activite(profile, age),
        check_rsa(profile, age),
        check_css(profile),
        check_bourse_crous(profile, age),
        check_mobili_jeune(profile, age),
        check_garantie_visale(profile, age),
        check_aide_permis(profile, age),
        check_cheque_energie(profile),
        check_als(profile, age),
    ]
}

fn check_apl(profile: &UserProfile, age: Option<i32>) -> AidResult {
    let mut reasons = Vec::new();
    let mut eligible = true;

    if profile.housing_type != "locataire" {
        reasons.push("Réservé aux locataires".into());
        eligible = false;
    }
    if profile.rent_amount <= 0.0 {
        reasons.push("Loyer requis".into());
        eligible = false;
    }

    let income_ceiling = match profile.household_type.as_str() {
        "couple" => 1900.0,
        "famille" => 2300.0 + (profile.dependents as f64 * 400.0),
        _ => 1500.0,
    };
    if profile.monthly_income > income_ceiling {
        reasons.push(format!("Revenus au-dessus du plafond (~{}€/mois)", income_ceiling as i32));
        eligible = false;
    }

    if eligible {
        reasons.push("Locataire avec revenus sous le plafond".into());
        if let Some(a) = age {
            if a < 30 { reasons.push(format!("{} ans — profil favorable", a)); }
        }
    }

    let est = match profile.housing_zone.as_str() {
        "zone_1" => "jusqu'à ~300€/mois",
        "zone_2" => "jusqu'à ~260€/mois",
        _ => "jusqu'à ~245€/mois",
    };

    AidResult {
        id: "apl".into(),
        name: "APL — Aide Personnalisée au Logement".into(),
        description: "Aide de la CAF pour réduire le montant du loyer. Le montant dépend des revenus, du loyer et de la zone géographique.".into(),
        category: "Logement".into(),
        estimated_amount: est.into(),
        eligible,
        reasons,
    }
}

fn check_prime_activite(profile: &UserProfile, age: Option<i32>) -> AidResult {
    let mut reasons = Vec::new();
    let mut eligible = true;

    if let Some(a) = age {
        if a < 18 {
            reasons.push("18 ans minimum".into());
            eligible = false;
        }
    }

    let has_activity = matches!(profile.status.as_str(), "salarie" | "alternant" | "independant")
        || profile.is_apprentice;

    if !has_activity && profile.monthly_income <= 0.0 {
        reasons.push("Revenus d'activité requis (salarié, alternant ou indépendant)".into());
        eligible = false;
    }

    if profile.is_student && !profile.is_apprentice {
        reasons.push("Non accessible aux étudiants (sauf alternants)".into());
        eligible = false;
    }

    let ceiling = match profile.household_type.as_str() {
        "couple" => 2700.0,
        "famille" => 3200.0 + (profile.dependents as f64 * 500.0),
        _ => 1800.0,
    };
    if profile.monthly_income > ceiling {
        reasons.push(format!("Revenus au-dessus du plafond (~{}€/mois)", ceiling as i32));
        eligible = false;
    }

    if eligible {
        reasons.push("Revenus d'activité sous le plafond".into());
    }

    AidResult {
        id: "prime_activite".into(),
        name: "Prime d'activité".into(),
        description: "Complément de revenus versé par la CAF aux travailleurs aux revenus modestes. Cumulable avec le salaire.".into(),
        category: "Revenus".into(),
        estimated_amount: "~100 à 550€/mois".into(),
        eligible,
        reasons,
    }
}

fn check_rsa(profile: &UserProfile, age: Option<i32>) -> AidResult {
    let mut reasons = Vec::new();
    let mut eligible = true;

    if let Some(a) = age {
        if a < 25 && profile.dependents == 0 {
            reasons.push("25 ans minimum (sauf parent isolé ou activité antérieure)".into());
            eligible = false;
        }
    }

    if profile.is_student && !profile.is_apprentice {
        reasons.push("Non accessible aux étudiants".into());
        eligible = false;
    }

    let ceiling = match profile.household_type.as_str() {
        "couple" => 920.0,
        "famille" => 920.0 + (profile.dependents as f64 * 220.0),
        _ => 607.0,
    };
    if profile.monthly_income > ceiling {
        reasons.push(format!("Revenus au-dessus du plafond (~{}€/mois)", ceiling as i32));
        eligible = false;
    }

    if eligible {
        reasons.push(format!("Revenus sous {}€ — éligible sous conditions", ceiling as i32));
    }

    AidResult {
        id: "rsa".into(),
        name: "RSA — Revenu de Solidarité Active".into(),
        description: "Revenu minimum garanti pour les personnes sans ressources ou à très faibles revenus.".into(),
        category: "Revenus".into(),
        estimated_amount: format!("jusqu'à ~{}€/mois", ceiling as i32),
        eligible,
        reasons,
    }
}

fn check_css(profile: &UserProfile) -> AidResult {
    let mut reasons = Vec::new();
    let mut eligible = true;

    let ceiling = match profile.household_type.as_str() {
        "couple" => 1200.0,
        "famille" => 1200.0 + (profile.dependents as f64 * 360.0),
        _ => 801.0,
    };

    if profile.monthly_income > ceiling {
        reasons.push(format!("Revenus au-dessus du plafond (~{}€/mois)", ceiling as i32));
        eligible = false;
    }

    if eligible {
        reasons.push("Revenus sous le plafond — mutuelle gratuite ou à ~1€/jour".into());
    }

    AidResult {
        id: "css".into(),
        name: "CSS — Complémentaire Santé Solidaire".into(),
        description: "Mutuelle gratuite ou à faible coût prise en charge par l'État pour les personnes à revenus modestes.".into(),
        category: "Santé".into(),
        estimated_amount: "gratuit ou ~1€/jour".into(),
        eligible,
        reasons,
    }
}

fn check_bourse_crous(profile: &UserProfile, age: Option<i32>) -> AidResult {
    let mut reasons = Vec::new();
    let mut eligible = true;

    if !profile.is_student {
        reasons.push("Réservé aux étudiants".into());
        eligible = false;
    }

    if let Some(a) = age {
        if a >= 28 {
            reasons.push("Moins de 28 ans requis".into());
            eligible = false;
        }
    }

    if eligible {
        reasons.push("Étudiant de moins de 28 ans — éligibilité selon revenus des parents".into());
        reasons.push("Simuler sur messervices.etudiant.gouv.fr".into());
    }

    AidResult {
        id: "bourse_crous".into(),
        name: "Bourse CROUS sur critères sociaux".into(),
        description: "Bourse mensuelle pour les étudiants en formation initiale. Le montant dépend des revenus du foyer fiscal des parents.".into(),
        category: "Éducation".into(),
        estimated_amount: "~100 à 600€/mois (échelons 0bis à 7)".into(),
        eligible,
        reasons,
    }
}

fn check_mobili_jeune(profile: &UserProfile, age: Option<i32>) -> AidResult {
    let mut reasons = Vec::new();
    let mut eligible = true;

    if !profile.is_apprentice {
        reasons.push("Réservé aux alternants/apprentis".into());
        eligible = false;
    }

    if let Some(a) = age {
        if a >= 30 {
            reasons.push("Moins de 30 ans requis".into());
            eligible = false;
        }
    }

    if profile.housing_type != "locataire" {
        reasons.push("Réservé aux locataires".into());
        eligible = false;
    }

    if eligible {
        reasons.push("Alternant locataire de moins de 30 ans".into());
    }

    AidResult {
        id: "mobili_jeune".into(),
        name: "Aide Mobili-Jeune".into(),
        description: "Aide au logement d'Action Logement pour les jeunes en alternance dans le secteur privé. Cumulable avec l'APL.".into(),
        category: "Logement".into(),
        estimated_amount: "10 à 100€/mois".into(),
        eligible,
        reasons,
    }
}

fn check_garantie_visale(profile: &UserProfile, age: Option<i32>) -> AidResult {
    let mut reasons = Vec::new();
    let mut eligible = true;

    if profile.housing_type != "locataire" {
        reasons.push("Réservé aux locataires".into());
        eligible = false;
    }

    if let Some(a) = age {
        if a > 30 {
            let precaire = matches!(profile.status.as_str(), "alternant" | "demandeur_emploi");
            if !precaire {
                reasons.push("Plus de 30 ans — réservé aux salariés précaires".into());
                eligible = false;
            }
        }
    }

    if eligible {
        reasons.push("Caution locative gratuite garantie par Action Logement".into());
    }

    AidResult {
        id: "garantie_visale".into(),
        name: "Garantie Visale".into(),
        description: "Caution locative gratuite qui garantit le paiement du loyer au propriétaire. Remplace le garant physique.".into(),
        category: "Logement".into(),
        estimated_amount: "caution gratuite".into(),
        eligible,
        reasons,
    }
}

fn check_aide_permis(profile: &UserProfile, age: Option<i32>) -> AidResult {
    let mut reasons = Vec::new();
    let mut eligible = true;

    if !profile.is_apprentice {
        reasons.push("Réservé aux apprentis".into());
        eligible = false;
    }

    if let Some(a) = age {
        if a < 18 {
            reasons.push("18 ans minimum".into());
            eligible = false;
        }
    }

    if eligible {
        reasons.push("Apprenti de 18 ans ou plus — aide forfaitaire".into());
    }

    AidResult {
        id: "aide_permis".into(),
        name: "Aide au permis de conduire (apprentis)".into(),
        description: "Aide forfaitaire de 500€ pour le passage du permis B, accessible à tous les apprentis majeurs.".into(),
        category: "Transport".into(),
        estimated_amount: "500€ (forfait unique)".into(),
        eligible,
        reasons,
    }
}

fn check_cheque_energie(profile: &UserProfile) -> AidResult {
    let mut reasons = Vec::new();
    let mut eligible = true;

    let annual_ceiling = match profile.household_type.as_str() {
        "couple" => 16500.0,
        "famille" => 16500.0 + (profile.dependents as f64 * 4400.0),
        _ => 11000.0,
    };
    let monthly_ceiling = annual_ceiling / 12.0;

    if profile.monthly_income > monthly_ceiling {
        reasons.push(format!("Revenus au-dessus du plafond (~{}€/an)", annual_ceiling as i32));
        eligible = false;
    }

    if eligible {
        reasons.push("Envoyé automatiquement si éligible — rien à demander".into());
    }

    AidResult {
        id: "cheque_energie".into(),
        name: "Chèque énergie".into(),
        description: "Aide annuelle pour payer les factures d'énergie ou des travaux de rénovation. Envoyé automatiquement selon le revenu fiscal.".into(),
        category: "Logement".into(),
        estimated_amount: "48 à 277€/an".into(),
        eligible,
        reasons,
    }
}

fn check_als(profile: &UserProfile, age: Option<i32>) -> AidResult {
    let mut reasons = Vec::new();
    let mut eligible = true;

    if profile.housing_type != "locataire" {
        reasons.push("Réservé aux locataires".into());
        eligible = false;
    }

    if profile.rent_amount <= 0.0 {
        reasons.push("Loyer requis".into());
        eligible = false;
    }

    let income_ceiling = match profile.household_type.as_str() {
        "couple" => 1900.0,
        "famille" => 2300.0 + (profile.dependents as f64 * 400.0),
        _ => 1500.0,
    };
    if profile.monthly_income > income_ceiling {
        reasons.push(format!("Revenus au-dessus du plafond (~{}€/mois)", income_ceiling as i32));
        eligible = false;
    }

    if eligible {
        reasons.push("Alternative à l'APL si le logement n'est pas conventionné".into());
        if let Some(a) = age {
            if profile.is_student && a < 30 {
                reasons.push("Profil étudiant — souvent éligible".into());
            }
        }
    }

    AidResult {
        id: "als".into(),
        name: "ALS — Allocation de Logement Sociale".into(),
        description: "Aide au logement de la CAF pour les locataires non éligibles à l'APL. Mêmes conditions de ressources.".into(),
        category: "Logement".into(),
        estimated_amount: "~50 à 250€/mois".into(),
        eligible,
        reasons,
    }
}
