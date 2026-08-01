import type { InvestmentTrack, PlannerInputs, ProjectionPoint, ReturnScenario, TrackProjection } from '../types';

interface ProjectOptions {
  ignoreFees?: boolean;
}

/**
 * מדמה צבירה פנסיונית חודשית עד גיל הפרישה, עם ריבית דריבית והפחתת דמי ניהול.
 * זהו מודל מפושט לצורך הדגמה — לא מחליף חישוב אקטוארי מלא.
 */
export function projectAccumulation(
  inputs: PlannerInputs,
  track: InvestmentTrack,
  scenario: ReturnScenario,
  options: ProjectOptions = {},
): ProjectionPoint[] {
  const months = Math.max(0, Math.round((inputs.retirementAge - inputs.currentAge) * 12));
  const annualReturn = track.expectedReturn[scenario];
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const feeFromDeposit = options.ignoreFees ? 0 : track.feeFromDeposit;
  const monthlyBalanceFee = options.ignoreFees ? 0 : track.feeFromBalance / 12;
  const currentYear = new Date().getFullYear();

  const points: ProjectionPoint[] = [
    { age: inputs.currentAge, year: currentYear, balance: inputs.currentBalance },
  ];

  let balance = inputs.currentBalance;
  const monthlyContribution = inputs.monthlySalary * inputs.contributionRate;

  for (let month = 1; month <= months; month += 1) {
    const contributionNet = monthlyContribution * (1 - feeFromDeposit);
    balance = balance * (1 + monthlyReturn) + contributionNet;
    balance = balance * (1 - monthlyBalanceFee);

    if (month % 12 === 0) {
      points.push({
        age: inputs.currentAge + month / 12,
        year: currentYear + month / 12,
        balance,
      });
    }
  }

  return points;
}

export function buildTrackProjection(
  inputs: PlannerInputs,
  track: InvestmentTrack,
  scenario: ReturnScenario,
): TrackProjection {
  const points = projectAccumulation(inputs, track, scenario);
  return {
    track,
    scenario,
    points,
    finalBalance: points[points.length - 1]?.balance ?? inputs.currentBalance,
  };
}

/** ההפרש בין הצבירה הסופית בלי דמי ניהול לבין הצבירה בפועל — "עלות" דמי הניהול. */
export function computeFeeImpact(inputs: PlannerInputs, track: InvestmentTrack, scenario: ReturnScenario) {
  const withFees = projectAccumulation(inputs, track, scenario);
  const withoutFees = projectAccumulation(inputs, track, scenario, { ignoreFees: true });

  const finalWithFees = withFees[withFees.length - 1]?.balance ?? 0;
  const finalWithoutFees = withoutFees[withoutFees.length - 1]?.balance ?? 0;

  return {
    finalWithFees,
    finalWithoutFees,
    lostToFees: finalWithoutFees - finalWithFees,
  };
}
