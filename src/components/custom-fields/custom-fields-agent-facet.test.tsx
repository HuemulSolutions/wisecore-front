/** Faceta para agentes en el form de custom field (perfil de proyecto de las colecciones para agentes). */
import { useState } from 'react'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import CustomFieldFormFields from '@/components/custom-fields/custom-fields-form-fields'
import { renderWithProviders } from '@/test/render'

function FacetHarness() {
  const [agentFacet, setAgentFacet] = useState(false)
  const [agentFacetKey, setAgentFacetKey] = useState('')
  return (
    <CustomFieldFormFields
      name="Runtime"
      description=""
      dataType="list"
      masc=""
      questionType=""
      options={[]}
      minValue={null}
      maxValue={null}
      config={{}}
      required={false}
      onNameChange={() => {}}
      onDescriptionChange={() => {}}
      onMascChange={() => {}}
      onQuestionTypeChange={() => {}}
      onOptionsChange={() => {}}
      onMinValueChange={() => {}}
      onMaxValueChange={() => {}}
      onConfigChange={() => {}}
      onRequiredChange={() => {}}
      agentFacet={agentFacet}
      agentFacetKey={agentFacetKey}
      onAgentFacetChange={setAgentFacet}
      onAgentFacetKeyChange={setAgentFacetKey}
      questionTypes={[]}
      formatQuestionType={(qt) => qt}
    />
  )
}

describe('CustomFieldFormFields · faceta para agentes', () => {
  it('muestra la ayuda y, al encenderla, la clave sugerida desde el nombre', async () => {
    const { user } = renderWithProviders(<FacetHarness />)

    expect(screen.getByText(/An asset without this field applies to all of them/)).toBeInTheDocument()
    expect(screen.queryByText('Facet key')).not.toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: /Agent facet/ }))
    expect(screen.getByDisplayValue('runtime')).toBeInTheDocument()
  })
})
